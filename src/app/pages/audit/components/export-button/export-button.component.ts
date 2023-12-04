import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { ExportFormat } from 'app/enums/export-format.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { PropertyPath } from 'app/interfaces/property-path.type';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/search-input/types/search-query.interface';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-export-button',
  templateUrl: './export-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportButtonComponent<T, M extends ApiJobMethod> {
  @Input() method: M;
  @Input() searchQuery: SearchQuery<T>;
  @Input() sorting: TableSort<T>;
  @Input() filename = 'data';

  isLoading = false;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private storage: StorageService,
  ) {}

  onExport(): void {
    this.isLoading = true;
    this.ws.job(this.method, this.getExportParams(
      this.getQueryFilters(this.searchQuery),
      this.getQueryOptions(this.sorting),
    )).pipe(
      switchMap((job) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        if (job.state === JobState.Failed) {
          this.dialogService.error(this.errorHandler.parseJobError(job));
          return EMPTY;
        }
        if (job.state !== JobState.Success) {
          return EMPTY;
        }
        const url = job.result as string;
        return this.ws.call('core.download', [this.method, [{}], url]);
      }),
      switchMap(([, url]) => {
        return this.storage.downloadUrl(url, `${this.filename}.csv`, 'text/csv');
      }),
      catchError((error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private getExportParams(
    queryFilters: QueryFilters<T>,
    queryOptions: QueryOptions<T>,
  ): ApiJobParams<M> {
    return [{
      'query-filters': queryFilters,
      'query-options': queryOptions,
      export_format: ExportFormat.Csv,
    }] as unknown as ApiJobParams<M>;
  }

  private getQueryFilters(searchQuery: SearchQuery<T>): QueryFilters<T> {
    if (searchQuery && searchQuery.isBasicQuery) {
      // TODO: Breaks encapsulation of the component.
      // TODO: Rest of the component is generic and is not tied to specific filters.
      return [['event', '~', `(?i)${searchQuery.query || ''}`]] as unknown as QueryFilters<T>;
    }

    if (searchQuery && !searchQuery.isBasicQuery) {
      return (searchQuery as AdvancedSearchQuery<T>).filters;
    }
    return [];
  }

  private getQueryOptions(sorting: TableSort<T>): QueryOptions<T> {
    if (!sorting) {
      return {};
    }

    if (sorting.propertyName === null || sorting.direction === null) {
      return {};
    }

    return {
      order_by: [
        ((sorting.direction === SortDirection.Desc ? '-' : '') + (sorting.propertyName as string)) as PropertyPath<T>,
      ],
    };
  }
}
