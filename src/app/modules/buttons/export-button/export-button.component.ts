import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, EMPTY, switchMap } from 'rxjs';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiCallDirectory } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { PropertyPath } from 'app/interfaces/property-path.type';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-export-button',
  templateUrl: './export-button.component.html',
  styleUrls: ['./export-button.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressBar,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class ExportButtonComponent<T, M extends ApiJobMethod> {
  readonly jobMethod = input.required<M>();
  readonly searchQuery = input<SearchQuery<T>>();
  readonly defaultFilters = input<QueryFilters<T>>();
  readonly sorting = input<TableSort<T>>();
  readonly filename = input('data');
  readonly fileType = input('csv');
  readonly fileMimeType = input('text/csv');
  readonly addReportNameArgument = input(false);
  // TODO: Does not belong to generic export button component.
  readonly controllerType = input<ControllerType>();
  readonly downloadMethod = input<keyof ApiCallDirectory>();

  isLoading = false;

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private download: DownloadService,
    private store$: Store<AppState>,
  ) {}

  onExport(): void {
    this.isLoading = true;
    this.api.job(this.jobMethod(), this.getExportParams(
      this.getQueryFilters(this.searchQuery()),
      this.getQueryOptions(this.sorting()),
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
        const downloadMethod = this.downloadMethod() || this.jobMethod();

        if (this.addReportNameArgument()) {
          customArguments.report_name = url;
        }

        return this.api.call('core.download', [downloadMethod, [customArguments], url]);
      }),
      switchMap(([, url]) => this.download.downloadUrl(url, `${this.filename()}.${this.fileType()}`, this.fileMimeType())),
      catchError((error: unknown) => {
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
      ...(this.isHaLicensed() && this.controllerType() && {
        remote_controller: this.controllerType() === ControllerType.Standby,
      }),
    }] as ApiJobParams<M>;
  }

  private getQueryFilters(searchQuery: SearchQuery<T>): QueryFilters<T> {
    if (searchQuery) {
      return (searchQuery as AdvancedSearchQuery<T>)?.filters || this.defaultFilters();
    }

    return [];
  }

  private getQueryOptions(sorting: TableSort<T>): QueryOptions<T> {
    if (!sorting?.propertyName || !sorting?.direction) {
      return {};
    }

    const orderPrefix = sorting.direction === SortDirection.Desc ? '-' : '';
    return {
      order_by: [`${orderPrefix}${sorting.propertyName as string}` as PropertyPath<T>],
    };
  }
}
