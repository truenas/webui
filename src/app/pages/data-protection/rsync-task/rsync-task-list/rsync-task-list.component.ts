import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { formatDistanceToNow } from 'date-fns';
import {
  catchError, EMPTY, filter, switchMap, take, tap,
} from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { ShowLogsDialogComponent } from 'app/modules/common/dialog/show-logs-dialog/show-logs-dialog.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { selectJob } from 'app/modules/jobs/store/job.selectors';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { TaskService } from 'app/services/task.service';
import { UserService } from 'app/services/user.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [TaskService, UserService],
})
export class RsyncTaskListComponent implements EntityTableConfig<RsyncTaskUi> {
  title = this.translate.instant('Rsync Tasks');
  queryCall = 'rsynctask.query' as const;
  wsDelete = 'rsynctask.delete' as const;
  routeAdd: string[] = ['tasks', 'rsync', 'add'];
  routeAddTooltip = this.translate.instant('Add Rsync Task');
  routeEdit: string[] = ['tasks', 'rsync', 'edit'];
  entityList: EntityTableComponent<RsyncTaskUi>;
  filterValue = '';

  columns = [
    { name: this.translate.instant('Path'), prop: 'path', always_display: true },
    { name: this.translate.instant('Remote Host'), prop: 'remotehost' },
    { name: this.translate.instant('Remote SSH Port'), prop: 'remoteport', hidden: true },
    { name: this.translate.instant('Remote Module Name'), prop: 'remotemodule' },
    { name: this.translate.instant('Remote Path'), prop: 'remotepath', hidden: true },
    { name: this.translate.instant('Direction'), prop: 'direction', hidden: true },
    {
      name: this.translate.instant('Schedule'),
      prop: 'cron_schedule',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: this.translate.instant('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: this.translate.instant('Next Run'), prop: 'next_run', hidden: true },
    { name: this.translate.instant('Last Run'), prop: 'last_run', hidden: true },
    { name: this.translate.instant('Short Description'), prop: 'desc', hidden: true },
    { name: this.translate.instant('User'), prop: 'user' },
    { name: this.translate.instant('Delay Updates'), prop: 'delayupdates', hidden: true },
    {
      name: this.translate.instant('Status'), prop: 'state', state: 'state', button: true,
    },
    { name: this.translate.instant('Enabled'), prop: 'enabled', hidden: true },
  ];
  rowIdentifier = 'path';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Rsync Task'),
      key_props: ['remotehost', 'remotemodule'],
    },
  };

  constructor(
    protected ws: WebSocketService,
    protected taskService: TaskService,
    protected dialog: DialogService,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    protected translate: TranslateService,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
  ) {
    this.filterValue = this.route.snapshot.paramMap.get('dataset') || '';
  }

  afterInit(entityList: EntityTableComponent<RsyncTaskUi>): void {
    this.entityList = entityList;
  }

  getActions(row: RsyncTaskUi): EntityTableAction<RsyncTaskUi>[] {
    return [{
      id: row.path,
      icon: 'play_arrow',
      label: this.translate.instant('Run Now'),
      name: 'run',
      actionName: 'run',
      onClick: () => {
        this.dialog.confirm({
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
              name: `${row.remotehost} - ${row.remotemodule}`,
            }),
          )),
          catchError((error: Job) => {
            this.dialog.error(this.errorHandler.parseJobError(error));
            return EMPTY;
          }),
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          row.job = { ...job };
          row.state.state = job.state;
        });
      },
    },
    {
      id: row.path,
      icon: 'edit',
      label: this.translate.instant('Edit'),
      name: 'edit',
      actionName: 'edit',
      onClick: () => {
        this.doEdit(row.id);
      },
    },
    {
      id: row.path,
      icon: 'delete',
      name: 'delete',
      actionName: 'delete',
      label: this.translate.instant('Delete'),
      onClick: () => {
        this.entityList.doDelete(row);
      },
    }];
  }

  resourceTransformIncomingRestData(tasks: RsyncTaskUi[]): RsyncTaskUi[] {
    return tasks.map((task) => {
      task.cron_schedule = scheduleToCrontab(task.schedule);
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);
      task.next_run = this.taskService.getTaskNextRun(task.cron_schedule);
      if (task.job?.time_finished?.$date) {
        task.last_run = formatDistanceToNow(task.job?.time_finished?.$date, { addSuffix: true });
      } else {
        task.last_run = this.translate.instant('N/A');
      }
      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.store$.select(selectJob(task.job.id)).pipe(
          filter(Boolean),
          take(1),
          untilDestroyed(this),
        ).subscribe((job: Job) => {
          task.state = { state: job.state };
          task.job = job;
        });
      }
      return task;
    });
  }

  onButtonClick(row: RsyncTaskUi): void {
    this.stateButton(row);
  }

  stateButton(row: RsyncTaskUi): void {
    if (row.job) {
      if (row.state.state === JobState.Running) {
        this.entityList.runningStateButton(row.job.id);
      } else {
        this.matDialog.open(ShowLogsDialogComponent, { data: row.job });
      }
    } else {
      this.dialog.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number): void {
    const rsyncTask = this.entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(RsyncTaskFormComponent, { wide: true, data: rsyncTask });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }
}
