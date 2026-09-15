import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { tnIconMarker, TnIconComponent } from '@truenas/ui-components';
import {
  catchError, EMPTY, filter, map, of, switchMap, tap,
} from 'rxjs';
import { rsyncTaskEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTask, RsyncTaskUi, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { CardAlertBadgeComponent } from 'app/modules/alerts/components/card-alert-badge/card-alert-badge.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import {
  scheduleColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-schedule/ix-cell-schedule.component';
import { stateButtonColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { selectJob, selectJobsByMethod } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { AppState } from 'app/store';

/** The task a run job belongs to. Every task run method takes the task id as its first argument. */
function taskIdOf(job: Job): number | null {
  const [taskId] = job.arguments as unknown[];
  return typeof taskId === 'number' ? taskId : null;
}

@Component({
  selector: 'ix-rsync-task-card',
  templateUrl: './rsync-task-card.component.html',
  styleUrls: ['./rsync-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    TnIconComponent,
    MatTooltip,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
    EmptyComponent,
    CardAlertBadgeComponent,
  ],
})
export class RsyncTaskCardComponent implements OnInit {
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private taskService = inject(TaskService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  protected emptyService = inject(EmptyService);
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotTaskWrite];
  protected readonly emptyConfig = rsyncTaskEmptyConfig;
  protected readonly cardMenuPath = ['data-protection', 'rsync'];

  rsyncTasks: RsyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<RsyncTaskUi>;
  jobStates = new Map<number, JobState>();

  private readonly runMethod: ApiJobMethod = 'rsynctask.run';

  /**
   * States already reloaded for, per job no row carries yet. Keeps
   * {@link watchExternalRuns} from reloading twice for the same job state.
   */
  private readonly externalJobStates = new Map<number, JobState>();

  columns = createTable<RsyncTaskUi>([
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Remote Host'),
      propertyName: 'remotehost',
    }),
    scheduleColumn({
      title: this.translate.instant('Frequency'),
      getValue: (row) => row.schedule,
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
      requiredRoles: this.requiredRoles,
      onRowToggle: (row: RsyncTaskUi) => this.onChangeEnabledState(row),
    }),
    stateButtonColumn({
      title: this.translate.instant('State'),
      getValue: (row) => row.state.state,
      getJob: (row) => row.job,
      cssClass: 'state-button',
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: tnIconMarker('play-circle', 'mdi'),
          tooltip: this.translate.instant('Run job'),
          requiredRoles: this.requiredRoles,
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
        },
        {
          iconName: tnIconMarker('delete', 'mdi'),
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-rsync-task-' + row.path + '-' + row.remotehost,
    ariaLabels: (row) => [row.path, row.remotehost, this.translate.instant('Rsync Task')],
  });

  ngOnInit(): void {
    const rsyncTasks$ = this.api.call('rsynctask.query').pipe(
      map((rsyncTasks: RsyncTaskUi[]) => this.transformRsyncTasks(rsyncTasks)),
      tap((rsyncTasks) => this.rsyncTasks = rsyncTasks),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<RsyncTaskUi>(rsyncTasks$);
    this.getRsyncTasks();
    this.watchExternalRuns();
  }

  /**
   * Rows only ever learn about the job they were queried with. A run started outside this
   * card — a cron-scheduled one, or one triggered from another tab — mints a *new* job id
   * that no row is watching, so the card would go on showing the previous run's state and
   * logs (or none at all, for a task that had never run) until something reloaded the list.
   * Re-query once per state of such a job, which is what hands the row its new job.
   */
  private watchExternalRuns(): void {
    this.store$.select(selectJobsByMethod(this.runMethod)).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((jobs) => {
      const rowJobIds = new Set(this.rsyncTasks.map((row) => row.job?.id));
      const unseenJobs = jobs.filter((job) => {
        const taskId = taskIdOf(job);
        return taskId !== null
          && !rowJobIds.has(job.id)
          && this.rsyncTasks.some((row) => row.id === taskId)
          && this.externalJobStates.get(job.id) !== job.state;
      });

      // Recorded before reloading so a second emit for the same state can't queue another.
      unseenJobs.forEach((job) => this.externalJobStates.set(job.id, job.state));
      // Jobs the rows have caught up with need no further bookkeeping.
      for (const jobId of this.externalJobStates.keys()) {
        if (rowJobIds.has(jobId)) {
          this.externalJobStates.delete(jobId);
        }
      }

      if (unseenJobs.length) {
        this.getRsyncTasks();
      }
    });
  }

  private getRsyncTasks(): void {
    this.dataProvider.load();
  }

  doDelete(row: RsyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Rsync Task <b>"{name}"</b>?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('rsynctask.delete', [row.id])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.getRsyncTasks();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  openForm(row?: RsyncTaskUi): void {
    this.slideIn.open(RsyncTaskFormComponent, { wide: true, data: row })
      .pipe(filter((response) => !!response.response), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.getRsyncTasks();
      });
  }

  runNow(row: RsyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Run Now'),
      message: this.translate.instant('Run «{name}» Rsync now?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      tap(() => this.updateRowStateAndJob(row, JobState.Running, row.job)),
      switchMap(() => this.api.job('rsynctask.run', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Rsync task «{name}» has started.', {
          name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
        }),
      )),
      catchError((error: unknown) => {
        this.getRsyncTasks();
        this.errorHandler.showErrorModal(error);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job: Job) => {
      this.updateRowStateAndJob(row, job.state, job);
      if (this.jobStates.get(job.id) !== job.state) {
        this.getRsyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  private transformRsyncTasks(rsyncTasks: RsyncTaskUi[]): RsyncTaskUi[] {
    // A fresh row with a freshly derived `state`, so the pill never reads through to the
    // query response. `job` is deliberately carried over by reference rather than spread:
    // `{ ...null }` is `{}`, which is truthy, so a task that has never run would be read as
    // having a job and render its (undefined) state as "N/A" instead of "Pending".
    return rsyncTasks.map((rsyncTask: RsyncTaskUi) => {
      const task: RsyncTaskUi = {
        ...rsyncTask,
        state: { state: this.getTaskState(rsyncTask) },
      };

      if (task.job) {
        this.store$.select(selectJob(task.job.id)).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
          .subscribe((job: Job) => {
            task.state = { state: job.state };
            task.job = job;
            this.jobStates.set(job.id, job.state);
          });
      }

      return task;
    });
  }

  private getTaskState(task: RsyncTaskUi): DisplayableState {
    if (!task.job) {
      return task.locked ? TaskState.Locked : TaskState.Pending;
    }

    return task.job.state;
  }

  private onChangeEnabledState(rsyncTask: RsyncTaskUi): void {
    this.api
      .call('rsynctask.update', [rsyncTask.id, { enabled: !rsyncTask.enabled } as RsyncTaskUpdate])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.getRsyncTasks();
        },
        error: (error: unknown) => {
          this.getRsyncTasks();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private updateRowStateAndJob(row: RsyncTask, state: JobState, job: Job | null): void {
    this.rsyncTasks = this.rsyncTasks.map((task) => {
      if (task.id === row.id) {
        return {
          ...task,
          state: { state },
          job,
        };
      }
      return task;
    });
    this.dataProvider.setRows(this.rsyncTasks);
  }
}
