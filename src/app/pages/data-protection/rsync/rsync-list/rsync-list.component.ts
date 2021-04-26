import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { WebSocketService, DialogService, TaskService, JobService, UserService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
import globalHelptext from '../../../../helptext/global-helptext';
import { ModalService } from 'app/services/modal.service';
import { RsyncFormComponent } from '../rsync-form/rsync-form.component';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';

@Component({
  selector: 'app-rsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, JobService, UserService, EntityFormService],
})
export class RsyncListComponent {
  public title = 'Rsync Tasks';
  protected queryCall = 'rsynctask.query';
  protected wsDelete = 'rsynctask.delete';
  protected route_add: string[] = ['tasks', 'rsync', 'add'];
  protected route_add_tooltip = 'Add Rsync Task';
  protected route_edit: string[] = ['tasks', 'rsync', 'edit'];
  protected entityList: any;
  protected asyncView = true;

  public columns: Array<any> = [
    { name: T('Path'), prop: 'path', always_display: true },
    { name: T('Remote Host'), prop: 'remotehost' },
    { name: T('Remote SSH Port'), prop: 'remoteport', hidden: true },
    { name: T('Remote Module Name'), prop: 'remotemodule' },
    { name: T('Remote Path'), prop: 'remotepath', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true },
    {
      name: T('Schedule'),
      prop: 'cron',
      hidden: true,
      widget: {
        icon: 'calendar-range',
        component: 'TaskScheduleListComponent',
      },
    },
    { name: T('Short Description'), prop: 'desc', hidden: true },
    { name: T('User'), prop: 'user' },
    { name: T('Delay Updates'), prop: 'delayupdates', hidden: true },
    { name: T('Status'), prop: 'state', state: 'state', button: true },
    { name: T('Enabled'), prop: 'enabled', hidden: true },
  ];
  public rowIdentifier = 'path';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Rsync Task',
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

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row: any) {
    const actions = [];
    actions.push({
      id: row.path,
      icon: 'play_arrow',
      label: T('Run Now'),
      name: 'run',
      onClick: () => {
        this.dialog.confirm(T('Run Now'), T('Run this rsync now?'), true).subscribe((run: boolean) => {
          if (run) {
            row.state = 'RUNNING';
            this.ws.call('rsynctask.run', [row.id]).subscribe(
              (res) => {
                this.dialog.Info(
                  T('Task Started'),
                  'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.',
                  '500px',
                  'info',
                  true,
                );
                this.job.getJobStatus(res).subscribe((task) => {
                  row.state = task.state;
                  row.job = task;
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this, err);
              },
            );
          }
        });
      },
    });
    actions.push({
      id: row.path,
      icon: 'edit',
      label: T('Edit'),
      name: 'edit',
      onClick: () => {
        this.doEdit(row.id);
      },
    });
    actions.push({
      id: row.path,
      icon: 'delete',
      name: 'delete',
      label: T('Delete'),
      onClick: () => {
        this.entityList.doDelete(row);
      },
    });

    return actions;
  }

  resourceTransformIncomingRestData(data: any[]) {
    return data.map((task) => {
      task.minute = task.schedule['minute'];
      task.hour = task.schedule['hour'];
      task.dom = task.schedule['dom'];
      task.month = task.schedule['month'];
      task.dow = task.schedule['dow'];

      task.cron = `${task.minute} ${task.hour} ${task.dom} ${task.month} ${task.dow}`;

      if (task.job == null) {
        task.state = { state: T('PENDING') };
      } else {
        task.state = { state: task.job.state };
        this.job.getJobStatus(task.job.id).subscribe((t) => {
          task.state = t.job ? { state: t.job.state } : null;
        });
      }
      return task;
    });
  }

  onButtonClick(row: any) {
    this.stateButton(row);
  }

  stateButton(row: any) {
    if (row.job) {
      if (row.state.state === 'RUNNING') {
        this.entityList.runningStateButton(row.job.id);
      } else {
        this.job.showLogs(row.job);
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }

  doAdd(id?: number) {
    this.modalService.open(
      'slide-in-form',
      new RsyncFormComponent(this.router, this.aroute, this.taskService, this.userService, this.modalService),
      id,
    );
  }

  doEdit(id: number) {
    this.doAdd(id);
  }
}
