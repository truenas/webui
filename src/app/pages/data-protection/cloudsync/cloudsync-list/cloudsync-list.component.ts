import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Type, computed, inject, viewChild, OnInit, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnDialog,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTestIdDirective,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import {
  EMPTY, catchError, filter, map, switchMap, tap,
} from 'rxjs';
import { cloudSyncTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { flattenEmptyConfigMessage } from 'app/helpers/empty-config.helper';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { TableColumnPickerComponent } from 'app/modules/ix-table/components/table-column-picker/table-column-picker.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import {
  createTable, dataProviderEmptyState, dataProviderLoading, dataProviderRows,
  detailActionTestId, mapTnSortToTableSort, perRow, rowTestIdTag, toDisplayedColumns,
} from 'app/modules/ix-table/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { cloudSyncListElements } from 'app/pages/data-protection/cloudsync/cloudsync-list/cloudsync-list.elements';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncDataTransformer } from 'app/pages/data-protection/cloudsync/utils/cloudsync-data-transformer';
import {
  TaskStateCellComponent,
} from 'app/pages/data-protection/components/task-state-cell/task-state-cell.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-cloudsync-list',
  templateUrl: './cloudsync-list.component.html',
  styleUrls: ['./cloudsync-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    BasicSearchComponent,
    TableColumnPickerComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnEmptyComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    TnTestIdDirective,
    TnTooltipDirective,
    TnTablePagerComponent,
    IxTableDetailsRowComponent,
    TableRelativeDateCellComponent,
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    TranslateModule,
  ],
})
export class CloudSyncListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private taskService = inject(TaskService);
  private formPanel = inject(FormSidePanelService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private tnDialog = inject(TnDialog);
  private snackbar = inject(SnackbarService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = cloudSyncListElements;
  protected readonly EmptyType = EmptyType;

  private cloudSyncTasks: CloudSyncTaskUi[] = [];
  protected readonly searchQuery = signal('');
  protected readonly jobState = JobState;
  protected readonly requiredRoles = [Role.CloudSyncWrite];

  private readonly cloudSyncTasks$ = this.api.call('cloudsync.query').pipe(
    map((cloudSyncTasks) => CloudSyncDataTransformer.transformTasks(
      cloudSyncTasks,
      this.taskService,
      this.translate,
    )),
    tap((cloudSyncTasks) => this.setupJobSubscriptions(cloudSyncTasks)),
    tap((cloudSyncTasks) => this.cloudSyncTasks = cloudSyncTasks),
  );

  readonly dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(this.cloudSyncTasks$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly empty = dataProviderEmptyState(this.dataProvider);

  // Bound from the shared catalog config rather than inlined in the template, so the
  // translated string has a single source of truth.
  protected readonly emptyMessage = flattenEmptyConfigMessage(
    this.translate.instant(cloudSyncTaskEmptyConfig.message),
  );

  // ix-table column model retained purely to drive <ix-table-column-picker>
  // (visibility + saved prefs) and the hidden-column list rendered in the detail
  // row; tn-table renders cells from the template and derives its
  // `displayedColumns` from these via `toDisplayedColumns`.
  protected readonly columns = signal(createTable<CloudSyncTaskUi>([
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Credential'),
      columnName: 'credential',
      hidden: true,
      getValue: (task) => task.credentials.name,
    }),
    textColumn({
      title: this.translate.instant('Direction'),
      propertyName: 'direction',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Transfer Mode'),
      propertyName: 'transfer_mode',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Schedule'),
      propertyName: 'schedule',
      hidden: true,
      getValue: (task) => this.getSchedule(task),
    }),
    scheduleColumn({
      title: this.translate.instant('Frequency'),
      getValue: (task) => task.schedule,
      propertyName: 'frequency_sort_key',
    }),
    textColumn({
      title: this.translate.instant('Next Run'),
      hidden: true,
      getValue: (task: CloudSyncTaskUi) => this.getNextRun(task),
      propertyName: 'next_run_sort_key',
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      hidden: true,
      getValue: (task) => task.job?.time_finished?.$date,
      propertyName: 'last_run_sort_key',
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      columnName: 'state',
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
  ], {
    // Still needed: <ix-table-details-row> renders the hidden columns through the
    // ix cell components, which read `uniqueRowTag`/`ariaLabels` off the column.
    uniqueRowTag: (row) => 'cloudsync-task-' + row.description,
    ariaLabels: (row) => [row.description, this.translate.instant('Cloud Sync Task')],
  }));

  protected readonly displayedColumns = computed<string[]>(() => toDisplayedColumns(this.columns()));

  protected readonly hiddenColumns = computed<Column<CloudSyncTaskUi, ColumnComponent<CloudSyncTaskUi>>[]>(
    () => this.columns().filter((column) => column?.hidden),
  );

  protected readonly trackByTaskId = (_index: number, row: CloudSyncTaskUi): number => row.id;

  protected readonly uniqueRowTag = rowTestIdTag<CloudSyncTaskUi>((row) => 'cloudsync-task-' + row.description);

  protected readonly ariaLabel = perRow<CloudSyncTaskUi, string>(
    (row) => [row.description, this.translate.instant('Cloud Sync Task')].join(' '),
  );

  protected detailActionTestId(row: CloudSyncTaskUi, action: string): string {
    return detailActionTestId([row.id], action);
  }

  protected getSchedule(task: CloudSyncTaskUi): string {
    return task.enabled ? scheduleToCrontab(task.schedule) : this.translate.instant('Disabled');
  }

  protected getNextRun(task: CloudSyncTaskUi): string {
    // For disabled tasks, show "Disabled" text; for enabled tasks, the
    // pre-computed relative time string.
    return task.enabled ? task.next_run : this.translate.instant('Disabled');
  }

  ngOnInit(): void {
    this.getCloudSyncTasks();
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  protected getCloudSyncTasks(): void {
    this.dataProvider.load();
  }

  protected runNow(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Sync Task now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync Task «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.getCloudSyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      if (job.state === JobState.Success) {
        this.snackbar.success(this.translate.instant('Cloud Sync Task «{name}» completed successfully.', { name: row.description }));
      }
      this.updateRowStateAndJob(row, job.state, job);
      this.cdr.markForCheck();
    });
  }

  protected stopCloudSyncTask(row: CloudSyncTaskUi): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Stop'),
        message: this.translate.instant('Stop this Cloud Sync?'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.api.call('cloudsync.abort', [row.id]).pipe(
            this.errorHandler.withErrorHandler(),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Cloud Sync «{name}» stopped.', { name: row.description }));
        this.updateRowStateAndJob(row, JobState.Aborted, null);
        this.cdr.markForCheck();
      });
  }

  protected dryRun(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextCloudSync.dryRunTitle),
      message: this.translate.instant(helptextCloudSync.dryRunDialog),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.job('cloudsync.sync', [row.id, { dry_run: true }])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync Task «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.getCloudSyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      if (job.state === JobState.Success) {
        this.snackbar.success(this.translate.instant('Cloud Sync Task «{name}» dry run completed successfully.', { name: row.description }));
      }
      this.updateRowStateAndJob(row, job.state, job);
      this.cdr.markForCheck();
    });
  }

  protected restore(row: CloudSyncTaskUi): void {
    this.tnDialog.open(CloudSyncRestoreDialog, { data: row.id })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been restored.', { name: row.description }),
        );
        this.getCloudSyncTasks();
      });
  }

  // CloudSyncFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly cloudSyncForm = CloudSyncFormComponent as unknown as Type<SidePanelForm>;
  // Wizard is hosted `footerless` — its tn-stepper owns its own Next/Save buttons.
  private readonly cloudSyncWizard = CloudSyncWizardComponent as unknown as Type<SidePanelForm>;

  protected openForm(row?: CloudSyncTaskUi): void {
    if (row) {
      this.formPanel.open(this.cloudSyncForm, {
        title: this.translate.instant('Edit Cloud Sync Task'),
        wide: true,
        inputs: { taskToEdit: row },
      }).onSuccess(() => this.getCloudSyncTasks(), this.destroyRef);
    } else {
      this.formPanel.open(this.cloudSyncWizard, {
        title: this.translate.instant('Cloud Sync Task Wizard'),
        wide: true,
        footerless: true,
      }).onSuccess(() => this.getCloudSyncTasks(), this.destroyRef);
    }
  }

  protected doDelete(row: CloudSyncTaskUi): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Delete Cloud Sync Task <b>"{name}"</b>?', { name: row.description }),
      call: () => this.api.call('cloudsync.delete', [row.id]),
      successMessage: this.translate.instant('Cloud Sync Task «{name}» deleted.', { name: row.description }),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.getCloudSyncTasks());
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({ query, columnKeys: ['description'] });
  }

  protected columnsChange(columns: ReturnType<typeof this.columns>): void {
    this.columns.set([...columns]);
  }

  private readonly table = viewChild(TnTableComponent<CloudSyncTaskUi>);

  /**
   * tn-table only expands through its chevron; the ix-table this replaced expanded on a
   * row click too, so drive the expansion from `(rowClick)` to keep that behaviour.
   */
  protected onRowClick(row: CloudSyncTaskUi): void {
    this.table()?.toggleRowExpansion(row);
  }

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider.setSorting(mapTnSortToTableSort<CloudSyncTaskUi>(event, this.displayedColumns()));
  }

  private setupJobSubscriptions(cloudSyncTasks: CloudSyncTaskUi[]): void {
    cloudSyncTasks.forEach((transformed) => {
      if (transformed.job) {
        this.store$.select(selectJob(transformed.job.id)).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
          .subscribe((job: Job) => {
            transformed.job = { ...job };
            transformed.state = { state: job.state };
            this.cdr.markForCheck();
          });
      }
    });
  }

  private updateRowStateAndJob(row: CloudSyncTaskUi, state: JobState, job: Job | null): void {
    this.dataProvider.setRows(this.cloudSyncTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    }));
  }
}
