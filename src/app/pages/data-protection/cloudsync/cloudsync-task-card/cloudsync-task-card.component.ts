import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  EMPTY, catchError, filter, map, of, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';
import { CloudSyncTaskUi, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { Job } from 'app/interfaces/job.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { CloudSyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-task-card',
  templateUrl: './cloudsync-task-card.component.html',
  styleUrls: ['./cloudsync-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CloudSyncTaskCardComponent implements OnInit {
  protected readonly requiredRoles = [Role.CloudSyncWrite];

  cloudSyncTasks: CloudSyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<CloudSyncTaskUi>;
  jobStates = new Map<number, JobState>();

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
      getValue: (row) => (row.enabled
        ? this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule))
        : this.translate.instant('Disabled')),
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.job?.time_finished?.$date,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: CloudSyncTaskUi) => this.onChangeEnabledState(row),
      requiredRoles: this.requiredRoles,
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      cssClass: 'state-button',
    }),
    actionsColumn({
      cssClass: 'wide-actions',
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('mdi-play-circle'),
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-stop-circle'),
          tooltip: this.translate.instant('Stop'),
          hidden: (row) => of(row.job?.state !== JobState.Running),
          onClick: (row) => this.stopCloudSyncTask(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('sync'),
          tooltip: this.translate.instant('Dry Run'),
          onClick: (row) => this.dryRun(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('restore'),
          tooltip: this.translate.instant('Restore'),
          onClick: (row) => this.restore(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-cloudsync-task-' + row.description,
    ariaLabels: (row) => [row.description, this.translate.instant('Cloud Sync Task')],
  });

  constructor(
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private slideIn: ChainedSlideInService,
    private cdr: ChangeDetectorRef,
    private taskService: TaskService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const cloudSyncTasks$ = this.ws.call('cloudsync.query').pipe(
      map((cloudSyncTasks: CloudSyncTaskUi[]) => this.transformCloudSyncTasks(cloudSyncTasks)),
      tap((cloudSyncTasks) => this.cloudSyncTasks = cloudSyncTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<CloudSyncTaskUi>(cloudSyncTasks$);
    this.getCloudSyncTasks();
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
    this.slideIn.open(CloudSyncWizardComponent, true).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getCloudSyncTasks();
      },
    });
  }

  onEdit(row?: CloudSyncTaskUi): void {
    const closer$ = this.slideIn.open(CloudSyncFormComponent, true, row);
    closer$.pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
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
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.getCloudSyncTasks();
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
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
        this.snackbar.success(this.translate.instant('Cloud Sync «{name}» stopped.', { name: row.description }));
        this.updateRowStateAndJob(row, JobState.Aborted, null);
        this.cdr.markForCheck();
      });
  }

  dryRun(row: CloudSyncTaskUi): void {
    this.dialogService.confirm({
      title: helptextCloudSync.dry_run_title,
      message: helptextCloudSync.dry_run_dialog,
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.job('cloudsync.sync', [row.id, { dry_run: true }])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Cloud Sync «{name}» has started.', { name: row.description }),
      )),
      catchError((error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      if (this.jobStates.get(job.id) !== job.state) {
        this.getCloudSyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  restore(row: CloudSyncTaskUi): void {
    this.matDialog
      .open(CloudSyncRestoreDialogComponent, { data: row.id })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(
          this.translate.instant('Cloud Sync «{name}» has been restored.', { name: row.description }),
        );
        this.getCloudSyncTasks();
      });
  }

  private transformCloudSyncTasks(cloudSyncTasks: CloudSyncTaskUi[]): CloudSyncTaskUi[] {
    return cloudSyncTasks.map((task) => {
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
        error: (err: unknown) => {
          this.getCloudSyncTasks();
          this.dialogService.error(this.errorHandler.parseError(err));
        },
      });
  }

  private updateRowStateAndJob(row: CloudSyncTaskUi, state: JobState, job: Job): void {
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
