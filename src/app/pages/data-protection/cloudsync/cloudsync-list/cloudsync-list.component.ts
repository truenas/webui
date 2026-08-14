import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Type, inject, OnInit, signal,
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
import { emptyConfigIcon } from 'app/helpers/empty-config.helper';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { translated } from 'app/helpers/translated.helper';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { ScheduleDescriptionPipe } from 'app/modules/dates/pipes/schedule-description/schedule-description.pipe';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FlattenEmptyMessagePipe } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AsyncDataProvider } from 'app/modules/tn-table/classes/async-data-provider/async-data-provider';
import { column } from 'app/modules/tn-table/column-configs';
import { TableColumnPickerComponent } from 'app/modules/tn-table/components/table-column-picker/table-column-picker.component';
import { IxTableDetailsRowComponent } from 'app/modules/tn-table/components/table-details-row/table-details-row.component';
import { createTable, detailActionTestId, tnTableListHost } from 'app/modules/tn-table/utils';
import { TableRelativeDateCellComponent,
  formatRelativeDateValue } from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import {
  TaskStateCellComponent,
} from 'app/modules/tn-table-cells/state-cell/task-state-cell.component';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { cloudSyncListElements } from 'app/pages/data-protection/cloudsync/cloudsync-list/cloudsync-list.elements';
import { CloudSyncRestoreDialog } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { CloudSyncDataTransformer } from 'app/pages/data-protection/cloudsync/utils/cloudsync-data-transformer';
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
    TnTablePagerComponent,
    IxTableDetailsRowComponent,
    TableRelativeDateCellComponent,
    TableTextCellComponent,
    TaskStateCellComponent,
    ScheduleDescriptionPipe,
    YesNoPipe,
    FlattenEmptyMessagePipe,
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

  // Bound from the shared catalog config rather than inlined in the template, so the
  // translated string has a single source of truth and follows a language change.
  protected readonly emptyConfig = cloudSyncTaskEmptyConfig;
  protected readonly emptyIcon = emptyConfigIcon(cloudSyncTaskEmptyConfig);

  // One source of truth per column title: the header, the cell (whose test id is built
  // from it) and the column model all read the same entry, so a rename cannot silently
  // change a data-test value. `translated` re-runs it on a language change — and because
  // the column model is passed as a factory, the picker and detail row re-read it too.
  protected readonly titles = translated(() => ({
    description: this.translate.instant('Description'),
    credential: this.translate.instant('Credential'),
    direction: this.translate.instant('Direction'),
    transferMode: this.translate.instant('Transfer Mode'),
    path: this.translate.instant('Path'),
    schedule: this.translate.instant('Schedule'),
    frequency: this.translate.instant('Frequency'),
    nextRun: this.translate.instant('Next Run'),
    lastRun: this.translate.instant('Last Run'),
    state: this.translate.instant('State'),
    enabled: this.translate.instant('Enabled'),
  }));

  protected readonly list = tnTableListHost<CloudSyncTaskUi>(this.dataProvider, {
    columns: () => createTable<CloudSyncTaskUi>([
      column({
        title: this.titles().description,
        propertyName: 'description',
      }),
      column({
        title: this.titles().credential,
        columnName: 'credential',
        hidden: true,
        getValue: (task) => task.credentials.name,
      }),
      column({
        title: this.titles().direction,
        propertyName: 'direction',
        hidden: true,
      }),
      column({
        title: this.titles().transferMode,
        propertyName: 'transfer_mode',
        hidden: true,
      }),
      column({
        title: this.titles().path,
        propertyName: 'path',
        hidden: true,
      }),
      column({
        title: this.titles().schedule,
        propertyName: 'schedule',
        hidden: true,
        getValue: (task) => this.getSchedule(task),
      }),
      // The three columns below render one thing and order by another: a schedule object, a
      // relative phrase ("in 3 days") and a formatted date all sort meaninglessly, so each names
      // the sort key `CloudSyncDataTransformer` derives for it. Spelled out, because a column's
      // `getValue` is otherwise what it sorts by.
      column({
        title: this.titles().frequency,
        getValue: (task) => task.schedule,
        propertyName: 'frequency_sort_key',
        sortBy: (task) => task.frequency_sort_key,
      }),
      column({
        title: this.titles().nextRun,
        hidden: true,
        getValue: (task: CloudSyncTaskUi) => this.getNextRun(task),
        propertyName: 'next_run_sort_key',
        sortBy: (task) => task.next_run_sort_key,
      }),
      column({
        title: this.titles().lastRun,
        hidden: true,
        getValue: (task) => task.job?.time_finished?.$date,
        // The table shows this through <ix-table-relative-date-cell>; a details row prints it.
        formatValue: (task) => formatRelativeDateValue(task.job?.time_finished?.$date, this.translate),
        propertyName: 'last_run_sort_key',
        sortBy: (task) => task.last_run_sort_key,
      }),
      column({
        title: this.titles().state,
        columnName: 'state',
        getValue: (row) => row.state.state,
        cssClass: 'state-button',
      }),
      column({
        title: this.titles().enabled,
        propertyName: 'enabled',
      }),
    ]),
  });

  protected readonly trackByTaskId = (_index: number, row: CloudSyncTaskUi): number => row.id;

  protected readonly uniqueRowTag = this.list.rowTag((row) => 'cloudsync-task-' + row.description);

  protected readonly ariaLabel = this.list.perRow(
    (row) => [row.description, this.translate.instant('Cloud Sync Task')].join(' '),
  );

  protected detailActionTestId(row: CloudSyncTaskUi, action: string): string {
    return detailActionTestId([row.id], action);
  }

  // Memoized: parsing a schedule into a crontab is the case `perRow` exists for, and
  // the template asks for it once per row per change-detection pass. Annotated rather
  // than inferred: the column model above calls it from a `getValue`, so inferring its
  // type from `this.list` would be circular.
  protected readonly getSchedule: (task: CloudSyncTaskUi) => string = this.list.perRow(
    (task) => (task.enabled ? scheduleToCrontab(task.schedule) : this.translate.instant('Disabled')),
  );

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
