import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY, catchError, filter, map, of, switchMap, tap,
} from 'rxjs';
import { FromWizardToAdvancedSubmitted } from 'app/enums/from-wizard-to-advanced.enum';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudsync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudsyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudsyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { fromWizardToAdvancedFormSubmitted } from 'app/store/admin-panel/admin.actions';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-task-card',
  templateUrl: './cloudsync-task-card.component.html',
  styleUrls: ['./cloudsync-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudSyncTaskCardComponent implements OnInit {
  cloudsyncTasks: CloudSyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<CloudSyncTaskUi>;
  jobStates = new Map<number, string>();
  readonly jobState = JobState;

  columns = createTable<CloudSyncTaskUi>([
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      propertyName: 'frequency',
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.job?.time_finished?.$date,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: CloudSyncTaskUi) => this.onChangeEnabledState(row),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: 'play_arrow',
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
        },
        {
          iconName: 'stop',
          tooltip: this.translate.instant('Stop'),
          hidden: (row) => of(row.job?.state !== JobState.Running),
          onClick: (row) => this.stopCloudSyncTask(row),
        },
        {
          iconName: 'sync',
          tooltip: this.translate.instant('Dry Run'),
          onClick: (row) => this.dryRun(row),
        },
        {
          iconName: 'restore',
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'card-cloudsync-task-' + row.id.toString(),
  });

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private actions$: Actions,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const cloudsyncTasks$ = this.ws.call('cloudsync.query').pipe(
      map((cloudsyncTasks: CloudSyncTaskUi[]) => this.transformCloudSyncTasks(cloudsyncTasks)),
      tap((cloudsyncTasks) => this.cloudsyncTasks = cloudsyncTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(cloudsyncTasks$);
    this.getCloudSyncTasks();
    this.listenForWizardToAdvancedSwitching();
  }

  getCloudSyncTasks(): void {
    this.dataProvider.load();
  }

  doDelete(cloudsyncTask: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Cloud Sync Task <b>"{name}"</b>?', {
        name: cloudsyncTask.description,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('cloudsync.delete', [cloudsyncTask.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudSyncTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  onAdd(): void {
    const slideInRef = this.slideInService.open(CloudsyncWizardComponent, { wide: true });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCloudSyncTasks();
    });
  }

  onEdit(row?: CloudSyncTaskUi): void {
    const slideInRef = this.slideInService.open(CloudsyncFormComponent, { data: row, wide: true });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getCloudSyncTasks();
    });
  }

  runNow(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Cloud Sync now?', { name: row.description }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => row.state = { state: JobState.Running }),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: Job) => {
        this.getCloudSyncTasks();
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      row.state = { state: job.state };
      row.job = job;
      if (this.jobStates.get(job.id) !== job.state) {
        this.getCloudSyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  stopCloudSyncTask(row: CloudSyncTaskUi): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Stop'),
        message: this.translate.instant('Stop this Cloud Sync?'),
        hideCheckbox: true,
      })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          return this.ws.call('cloudsync.abort', [row.id]).pipe(
            this.errorHandler.catchError(),
          );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogService.info(
          this.translate.instant('Task Stopped'),
          this.translate.instant('Cloud Sync «{name}» stopped.', { name: row.description }),
          true,
        );
        row.state = { state: JobState.Aborted };
        row.job = null;
        this.cdr.markForCheck();
      });
  }

  dryRun(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: helptextCloudsync.dry_run_title,
      message: helptextCloudsync.dry_run_dialog,
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id, { dry_run: true }])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: Job) => {
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      row.state = { state: job.state };
      row.job = job;
      if (this.jobStates.get(job.id) !== job.state) {
        this.getCloudSyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  restore(row: CloudSyncTaskUi): void {
    const dialog = this.matDialog.open(CloudsyncRestoreDialogComponent, {
      data: row.id,
    });
    dialog.afterClosed().pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.getCloudSyncTasks());
  }

  private transformCloudSyncTasks(cloudsyncTasks: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    return cloudsyncTasks.map((task) => {
      const formattedCronSchedule = scheduleToCrontab(task.schedule);
      task.credential = task.credentials.name;
      task.cron_schedule = task.enabled ? formattedCronSchedule : this.translate.instant('Disabled');
      task.frequency = this.taskService.getTaskCronDescription(formattedCronSchedule);
      task.next_run_time = task.enabled ? this.taskService.getTaskNextTime(formattedCronSchedule) : this.translate.instant('Disabled');

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean), untilDestroyed(this))
          .subscribe((job: Job) => {
            task.state = { state: job.state };
            task.job = job;
            this.jobStates.set(job.id, job.state);
          });
      }

      return task;
    });
  }

  private onChangeEnabledState(cloudsyncTask: CloudSyncTaskUi): void {
    this.ws
      .call('cloudsync.update', [cloudsyncTask.id, { enabled: !cloudsyncTask.enabled } as CloudSyncTaskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getCloudSyncTasks();
        },
        error: (err: WebsocketError) => {
          this.getCloudSyncTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }

  private listenForWizardToAdvancedSwitching(): void {
    this.actions$.pipe(
      ofType(fromWizardToAdvancedFormSubmitted),
      filter(({ formType }) => formType === FromWizardToAdvancedSubmitted.CloudSyncTask),
      untilDestroyed(this),
    ).subscribe(() => this.getCloudSyncTasks());
  }
}
