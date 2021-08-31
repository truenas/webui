import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { JobState } from 'app/enums/job-state.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { Job } from 'app/interfaces/job.interface';
import { RsyncTaskUi } from 'app/interfaces/rsync-task.interface';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { RsyncFormComponent } from 'app/pages/data-protection/rsync/rsync-form/rsync-form.component';
import {
  WebSocketService, DialogService, TaskService, JobService, UserService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-rsync-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
  providers: [TaskService, JobService, UserService, EntityFormService],
})
export class RsyncListComponent implements EntityTableConfig {
  title = T('Rsync Tasks');
  queryCall: 'rsynctask.query' = 'rsynctask.query';
  wsDelete: 'rsynctask.delete' = 'rsynctask.delete';
  route_add: string[] = ['tasks', 'rsync', 'add'];
  route_add_tooltip = T('Add Rsync Task');
  route_edit: string[] = ['tasks', 'rsync', 'edit'];
  entityList: EntityTableComponent;
  asyncView = true;

  columns = [
    { name: T('Path'), prop: 'path', always_display: true },
    { name: T('Remote Host'), prop: 'remotehost' },
    { name: T('Remote SSH Port'), prop: 'remoteport', hidden: true },
    { name: T('Remote Module Name'), prop: 'remotemodule' },
    { name: T('Remote Path'), prop: 'remotepath', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true },
    {
      name: T('Schedule'),
      prop: 'cron_schedule',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Frequency'), prop: 'frequency', enableMatTooltip: true },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Short Description'), prop: 'desc', hidden: true },
    { name: T('User'), prop: 'user' },
    { name: T('Delay Updates'), prop: 'delayupdates', hidden: true },
    {
      name: T('Status'), prop: 'state', state: 'state', button: true,
    },
    { name: T('Enabled'), prop: 'enabled', hidden: true },
  ];
  rowIdentifier = 'path';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Rsync Task'),
      key_props: ['remotehost', 'remotemodule'],
    },
  };

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected taskService: TaskService,
    protected dialog: DialogService,
    protected translate: TranslateService,
    protected job: JobService,
    protected modalService: ModalService,
    protected userService: UserService,
    protected entityFormService: EntityFormService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getActions(row: RsyncTaskUi): EntityTableAction<RsyncTaskUi>[] {
    return [{
      id: row.path,
      icon: 'play_arrow',
      label: T('Run Now'),
      name: 'run',
      actionName: 'run',
      onClick: () => {
        this.dialog.confirm({
          title: T('Run Now'),
          message: T('Run this rsync now?'),
          hideCheckBox: true,
        }).pipe(untilDestroyed(this)).subscribe((run: boolean) => {
          if (run) {
            row.state = { state: JobState.Running };
            this.ws.call('rsynctask.run', [row.id]).pipe(untilDestroyed(this)).subscribe(
              (jobId: number) => {
                this.dialog.info(
                  T('Task Started'),
                  'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.',
                  '500px',
                  'info',
                  true,
                );
                this.job.getJobStatus(jobId).pipe(untilDestroyed(this)).subscribe((job: Job) => {
                  row.state = { state: job.state };
                  row.job = job;
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this, err);
              },
            );
          }
        });
      },
    },
    {
      id: row.path,
      icon: 'edit',
      label: T('Edit'),
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
      label: T('Delete'),
      onClick: () => {
        this.entityList.doDelete(row);
      },
    }];
  }

  resourceTransformIncomingRestData(data: RsyncTaskUi[]): RsyncTaskUi[] {
    return data.map((task) => {
      task.cron_schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${task.schedule.dow}`;
      task.frequency = this.taskService.getTaskNextRun(task.cron_schedule);
      task.next_run = this.taskService.getTaskCronDescription(task.cron_schedule);

      if (task.job == null) {
        task.state = { state: JobState.Pending };
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
      this.dialog.info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  doAdd(id?: number): void {
    this.modalService.open(
      'slide-in-form',
      new RsyncFormComponent(this.router, this.aroute, this.taskService, this.userService, this.modalService),
      id,
    );
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
