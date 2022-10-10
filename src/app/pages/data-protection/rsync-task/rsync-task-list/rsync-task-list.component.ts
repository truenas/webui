import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import {
  WebSocketService, DialogService, TaskService, JobService, UserService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
  providers: [TaskService, JobService, UserService, EntityFormService],
})
export class RsyncTaskListComponent implements EntityTableConfig {
  title = this.translate.instant('Rsync Tasks');
  queryCall = 'rsynctask.query' as const;
  wsDelete = 'rsynctask.delete' as const;
  routeAdd: string[] = ['tasks', 'rsync', 'add'];
  routeAddTooltip = this.translate.instant('Add Rsync Task');
  routeEdit: string[] = ['tasks', 'rsync', 'edit'];
  entityList: EntityTableComponent;
  asyncView = true;
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
    protected job: JobService,
    private slideInService: IxSlideInService,
    protected translate: TranslateService,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
  ) {
    this.filterValue = this.route.snapshot.paramMap.get('dataset') || '';
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
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
          message: this.translate.instant('Run this rsync now?'),
          hideCheckBox: true,
        }).pipe(untilDestroyed(this)).subscribe((run: boolean) => {
          if (run) {
            row.state = { state: JobState.Running };
            this.ws.call('rsynctask.run', [row.id]).pipe(untilDestroyed(this)).subscribe({
              next: (jobId: number) => {
                this.dialog.info(
                  this.translate.instant('Task Started'),
                  'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.',
                  true,
                );
                this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                  row.state = { state: job.state };
                  row.job = job;
                });
              },
              error: (err) => {
                new EntityUtils().handleWsError(this, err);
              },
            });
          }
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
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskCronDescription(task.cron_schedule);

      this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
        task.next_run = this.taskService.getTaskNextRun(task.cron_schedule, timezone);
      });

      if (task.job === null) {
        task.state = { state: task.locked ? JobState.Locked : JobState.Pending };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).pipe(untilDestroyed(this)).subscribe((job: Job) => {
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
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.warn(globalHelptext.noLogDialog.title, globalHelptext.noLogDialog.message);
    }
  }

  doAdd(): void {
    this.slideInService.open(RsyncTaskFormComponent, { wide: true });
  }

  doEdit(id: number): void {
    const row = this.entityList.rows.find((row) => row.id === id);
    const form = this.slideInService.open(RsyncTaskFormComponent, { wide: true });
    form.setTaskForEdit(row);
  }
}
