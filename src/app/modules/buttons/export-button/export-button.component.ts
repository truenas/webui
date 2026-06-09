import { ChangeDetectionStrategy, Component, DestroyRef, input, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnProgressBarComponent } from '@truenas/ui-components';
import {
  catchError, EMPTY, finalize, switchMap,
} from 'rxjs';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ExportFormat } from 'app/enums/export-format.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiCallDirectory } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod, ApiJobParams } from 'app/interfaces/api/api-job-directory.interface';
import { PropertyPath } from 'app/interfaces/property-path.type';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';
import { AdvancedSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-export-button',
  templateUrl: './export-button.component.html',
  styleUrls: ['./export-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnProgressBarComponent,
    TranslateModule,
  ],
})
export class ExportButtonComponent<T, M extends ApiJobMethod> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private download = inject(DownloadService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  readonly jobMethod = input.required<M>();
  readonly searchQuery = input<SearchQuery<T>>();
  readonly defaultFilters = input<QueryFilters<T>>();
  readonly sorting = input<TableSort<T>>();
  readonly filename = input('data');
  readonly fileType = input('csv');
  readonly fileMimeType = input('text/csv');
  readonly ariaLabel = input<string>();
  readonly displayFormat = input<string>(); // Display format for button text (e.g., 'CSV', 'JSON', 'YAML')
  readonly addReportNameArgument = input(false);
  // TODO: Does not belong to generic export button component.
  readonly controllerType = input<ControllerType>();
  readonly downloadMethod = input<keyof ApiCallDirectory>();
  readonly exportFormat = input<ExportFormat>(ExportFormat.Csv);
  readonly customExportParams = input<Record<string, unknown>>();

  protected readonly isLoading = signal(false);

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));

  onExport(): void {
    this.isLoading.set(true);
    this.api.job(this.jobMethod(), this.getExportParams(
      this.getQueryFilters(this.searchQuery()),
      this.getQueryOptions(this.sorting()),
    )).pipe(
      switchMap((job) => {
        // `api.job` emits intermediate (running) states too, and surfaces failures
        // through `catchError` rather than as a `next`. Only act once the job has
        // succeeded; ignore every other emission and wait for the next one.
        if (job.state !== JobState.Success) {
          return EMPTY;
        }

        const url = job.result as string;
        const customArguments = {} as { report_name?: string };
        const downloadMethod = this.downloadMethod() || this.jobMethod();

        if (this.addReportNameArgument()) {
          // The export job's result is the generated report's download URL; the
          // download endpoint expects that URL under the `report_name` argument.
          customArguments.report_name = url;
        }

        return this.download.coreDownload({
          method: downloadMethod,
          arguments: [customArguments],
          fileName: `${this.filename()}.${this.fileType()}`,
          mimeType: this.fileMimeType(),
        });
      }),
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      // Clears the loader on every terminal path — success, failure, abort, error,
      // or component teardown — including jobs that only ever emit non-success
      // states and so never reach the `subscribe` callback.
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private getExportParams(
    queryFilters: QueryFilters<T>,
    queryOptions: QueryOptions<T>,
  ): ApiJobParams<M> {
    return [{
      'query-filters': queryFilters,
      'query-options': queryOptions,
      export_format: this.exportFormat(),
      ...(this.isHaLicensed() && this.controllerType() && {
        remote_controller: this.controllerType() === ControllerType.Standby,
      }),
      ...this.customExportParams(),
    }] as ApiJobParams<M>;
  }

  private getQueryFilters(searchQuery?: SearchQuery<T>): QueryFilters<T> {
    if (searchQuery) {
      return (searchQuery as AdvancedSearchQuery<T>)?.filters || this.defaultFilters();
    }

    return [];
  }

  private getQueryOptions(sorting?: TableSort<T>): QueryOptions<T> {
    if (!sorting?.propertyName || !sorting?.direction) {
      return {};
    }

    const orderPrefix = sorting.direction === SortDirection.Desc ? '-' : '';
    return {
      order_by: [`${orderPrefix}${sorting.propertyName as string}` as PropertyPath<T>],
    };
  }
}
