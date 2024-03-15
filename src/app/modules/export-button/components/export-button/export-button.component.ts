import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { ExportFormat } from 'app/enums/export-format.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiCallDirectory } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { PropertyPath } from 'app/interfaces/property-path.type';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/search-input/types/search-query.interface';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-export-button',
  templateUrl: './export-button.component.html',
  styleUrls: ['./export-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExportButtonComponent<T, M extends ApiJobMethod> {
  @Input() jobMethod: M;
  @Input() searchQuery: SearchQuery<T>;
  @Input() defaultFilters: QueryFilters<T>;
  @Input() sorting: TableSort<T>;
  @Input() filename = 'data';
  @Input() fileType = 'csv';
  @Input() fileMimeType = 'text/csv';
  @Input() addReportNameArgument = false;
  @Input() downloadMethod?: keyof ApiCallDirectory;

  isLoading = false;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private download: DownloadService,
  ) {}

  onExport(): void {
    this.isLoading = true;
    this.ws.job(this.jobMethod, this.getExportParams(
      this.getQueryFilters(this.searchQuery),
      this.getQueryOptions(this.sorting),
    )).pipe(
      switchMap((job) => {
        this.cdr.markForCheck();
        if (job.state === JobState.Failed) {
          this.dialogService.error(this.errorHandler.parseError(job));
          return EMPTY;
        }
        if (job.state !== JobState.Success) {
          return EMPTY;
        }

        const url = job.result as string;
        const customArguments = {} as { report_name?: string };
        const downloadMethod = this.downloadMethod || this.jobMethod;

        if (this.addReportNameArgument) {
          customArguments.report_name = url;
        }

        return this.ws.call('core.download', [downloadMethod, [customArguments], url]);
      }),
      switchMap(([, url]) => this.download.downloadUrl(url, `${this.filename}.${this.fileType}`, this.fileMimeType)),
      catchError((error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.isLoading = false;
      this.cdr.markForCheck();
    });
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
    if (searchQuery) {
      return (searchQuery as AdvancedSearchQuery<T>)?.filters || this.defaultFilters;
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
