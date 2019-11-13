import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { WebSocketService, DialogService, TaskService, JobService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';
import globalHelptext from '../../../../helptext/global-helptext';

@Component({
  selector: 'app-rsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService, JobService]
})
export class RsyncListComponent {

  public title = "Rsync Tasks";
  //protected resource_name = 'tasks/rsync';
  protected queryCall = 'rsynctask.query';
  protected wsDelete = 'rsynctask.delete';
  protected route_add: string[] = ['tasks', 'rsync', 'add'];
  protected route_add_tooltip = "Add Rsync Task";
  protected route_edit: string[] = ['tasks', 'rsync', 'edit'];
  protected entityList: any;
  protected asyncView = true;

  public columns: Array < any > = [
    { name: T('Path'), prop: 'path', always_display: true },
    { name: T('Remote Host'), prop: 'remotehost' },
    { name: T('Remote SSH Port'), prop: 'remoteport', hidden: true },
    { name: T('Remote Module Name'), prop: 'remotemodule' },
    { name: T('Remote Path'), prop: 'path', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true },
    { name: T('Schedule'), prop: 'cron', hidden: true, widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' } },
    { name: T('Short Description'), prop: 'desc', hidden: true },
    { name: T('User'), prop: 'user' },
    { name: T('Delay Updates'), prop: 'delayupdates', hidden: true },
    { name: T('Status'), prop: 'state', state: 'state'},
    { name: T('Enabled'), prop: 'enabled', hidden: true },
  ];
  public rowIdentifier = 'path';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Rsync Task',
      key_props: ['remotehost', 'remotemodule']
    },
  };

  constructor(protected router: Router, protected ws: WebSocketService, protected taskService: TaskService,
              protected dialog: DialogService, protected translate: TranslateService, protected job: JobService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  getActions(row) {
    const actions = [];
    actions.push({
      id: row.path,
      icon: 'play_arrow',
      label : T("Run Now"),
      name: "run",
      onClick : (members) => {
        this.dialog.confirm(T("Run Now"), T("Run this rsync now?"), true).subscribe((run) => {
          if (run) {
            row.state = 'RUNNING';
            this.ws.call('rsynctask.run', [row.id] ).subscribe((res) => {
              this.dialog.Info(T('Task Started'), 'Rsync task <i>' + row.remotehost + ' - ' + row.remotemodule + '</i> started.', '500px', 'info', true);
              this.job.getJobStatus(res).subscribe((task) => {
                row.state = task.state;
                row.job = task;
              });
            }, (err) => {
              new EntityUtils().handleWSError(this, err);
            });
          }
        });
      }
    });
    actions.push({
      id: row.path,
      icon: 'edit',
      label : T("Edit"),
      name: "edit",
      onClick : (task_edit) => {
        this.router.navigate(new Array('/').concat(
          [ 'tasks', 'rsync', 'edit', row.id ]));
      }
    })
    actions.push({
      id: row.path,
      icon: 'delete',
      name: 'delete',
      label : T("Delete"),
      onClick : (task_delete) => {
        this.entityList.doDelete(row);
      },
    });

    return actions;
  }

  resourceTransformIncomingRestData(data) {
    return data.map(task =>  {
      task.minute = task.schedule['minute'];
      task.hour = task.schedule['hour'];
      task.dom = task.schedule['dom'];
      task.month = task.schedule['month'];
      task.dow = task.schedule['dow'];

      task.cron = `${task.minute} ${task.hour} ${task.dom} ${task.month} ${task.dow}`;

      if (task.job == null) {
        task.state = T("PENDING");
      } else {
        task.state = task.job.state;
        this.job.getJobStatus(task.job.id).subscribe((t) => {
          t.state = t.job ? t.job.state : null;
        });
      }
      return task;
    })
  }

  stateButton(row) {
    if (row.job) {
      if (row.job.error) {
        if (row.job.id) {
          this.dialog.confirm(row.job.state,row.job.error,true, T('VIEW LOGS')).subscribe(
            (res) => {
                if (res) {
                    this.job.showLogs(row.job.id);
                }
            })
        } else {
          this.dialog.errorReport(row.job.state, row.job.error);
        }
      } else {
        if (row.state === 'RUNNING') {
          this.entityList.runningStateButton(row.job.id);
        } else {
          this.job.showLogs(row.job.id);
        }
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }
}
