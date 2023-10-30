import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { catchError, EMPTY, filter, map, of, switchMap, tap } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi, RsyncTaskUpdate } from 'app/interfaces/rsync-task.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
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
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-rsync-task-card',
  templateUrl: './rsync-task-card.component.html',
  styleUrls: ['./rsync-task-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RsyncTaskCardComponent implements OnInit {
  rsyncTasks: RsyncTaskUi[] = [];
  dataProvider: AsyncDataProvider<RsyncTaskUi>;
  jobStates = new Map<number, string>();
  readonly jobState = JobState;

  columns = createTable<RsyncTaskUi>('rsync-task-card', [
    textColumn({
      title: this.translate.instant('Path'),
      propertyName: 'path',
    }),
    textColumn({
      title: this.translate.instant('Remote Host'),
      propertyName: 'remotehost',
    }),
    textColumn({
      title: this.translate.instant('Frequency'),
      getValue: (row) => this.taskService.getTaskCronDescription(scheduleToCrontab(row.schedule)),
    }),
    relativeDateColumn({
      title: this.translate.instant('Next Run'),
      getValue: (row) => this.taskService.getTaskNextTime(scheduleToCrontab(row.schedule)) as unknown,
    }),
    relativeDateColumn({
      title: this.translate.instant('Last Run'),
      getValue: (row) => row.job?.time_finished?.$date,
    }),
    toggleColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      onRowToggle: (row: RsyncTaskUi) => this.onChangeEnabledState(row),
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
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'play_arrow',
          tooltip: this.translate.instant('Run job'),
          hidden: (row) => of(row.job?.state === JobState.Running),
          onClick: (row) => this.runNow(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ]);

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
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const rsyncTasks$ = this.ws.call('rsynctask.query').pipe(
      map((rsyncTasks: RsyncTaskUi[]) => this.transformRsyncTasks(rsyncTasks)),
      tap((rsyncTasks) => this.rsyncTasks = rsyncTasks),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<RsyncTaskUi>(rsyncTasks$);
  }

  getRsyncTasks(): void {
    this.dataProvider.refresh();
  }

  doDelete(row: RsyncTaskUi): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Delete Rsync Task <b>"{name}"</b>?', {
        name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
      }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('rsynctask.delete', [row.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getRsyncTasks();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  openForm(row?: RsyncTaskUi): void {
    const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { data: row, wide: true });

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
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
      tap(() => row.state = { state: JobState.Running }),
      switchMap(() => this.ws.job('rsynctask.run', [row.id])),
      tapOnce(() => this.snackbar.success(
        this.translate.instant('Rsync task «{name}» has started.', {
          name: `${row.remotehost || row.path} ${row.remotemodule ? '- ' + row.remotemodule : ''}`,
        }),
      )),
      catchError((error: Job) => {
        this.getRsyncTasks();
        this.dialogService.error(this.errorHandler.parseJobError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((job: Job) => {
      row.state = { state: job.state };
      row.job = job;
      if (this.jobStates.get(job.id) !== job.state) {
        this.getRsyncTasks();
      }
      this.jobStates.set(job.id, job.state);
    });
  }

  private transformRsyncTasks(rsyncTasks: RsyncTaskUi[]): RsyncTaskUi[] {
    return rsyncTasks.map((task: RsyncTaskUi) => {
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

  private onChangeEnabledState(rsyncTask: RsyncTaskUi): void {
    this.ws
      .call('rsynctask.update', [rsyncTask.id, { enabled: !rsyncTask.enabled } as RsyncTaskUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.getRsyncTasks();
        },
        error: (err: WebsocketError) => {
          this.getRsyncTasks();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
  }
}
