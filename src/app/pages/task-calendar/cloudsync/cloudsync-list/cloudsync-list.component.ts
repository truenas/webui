import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import { DialogService, JobService, TaskService, WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../../../common/entity/utils';
import { TaskScheduleListComponent } from '../../components/task-schedule-list/task-schedule-list.component';
import globalHelptext from '../../../../helptext/global-helptext';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [JobService, TaskService],
})
export class CloudsyncListComponent implements InputTableConf {

  public title = "Cloud Sync Tasks";
  public queryCall = 'cloudsync.query';
  public route_add: string[] = ['tasks', 'cloudsync', 'add'];
  public route_add_tooltip = "Add Cloud Sync Task";
  public route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  public wsDelete = "cloudsync.delete";
  protected entityList: any;
  public asyncView = true;

  public columns: Array < any > = [
    { name: T('Description'), prop: 'description', always_display: true },
    { name: T('Credential'), prop: 'credential', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true},
    { name: T('Transfer Mode'), prop: 'transfer_mode', hidden: true },
    { name: T('Path'), prop: 'path', hidden: true},
    { name: T('Schedule'), prop: 'cron', hidden: true, widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' } },
    { name: T('Next Run'), prop: 'next_run', hidden: true},
    { name: T('Minute'), prop: 'minute', hidden: true },
    { name: T('Hour'), prop: 'hour', hidden: true },
    { name: T('Day of Month'), prop: 'dom', hidden: true },
    { name: T('Month'), prop: 'month', hidden: true },
    { name: T('Day of Week'), prop: 'dow', hidden: true },
    { name: T('Status'), prop: 'state', state: 'state', infoStates: ['NOT RUN SINCE LAST BOOT']},
    { name: T('Enabled'), prop: 'enabled' },
  ];
  public rowIdentifier = 'description';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cloud Sync Task',
      key_props: ['description']
    },
  };

  constructor(protected router: Router,
              protected ws: WebSocketService,
              protected translateService: TranslateService,
              protected dialog: DialogService,
              protected job: JobService) {
              }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  resourceTransformIncomingRestData(data) {
    return data.map(task =>  {
      task.minute = task.schedule['minute'];
      task.hour = task.schedule['hour'];
      task.dom = task.schedule['dom'];
      task.month = task.schedule['month'];
      task.dow = task.schedule['dow'];
      task.credential = task.credentials['name'];
      
      task.cron = `${task.minute} ${task.hour} ${task.dom} ${task.month} ${task.dow}`;
      
      /* Weird type assertions are due to a type definition error in the cron-parser library */
      task.next_run = ((cronParser.parseExpression(task.cron, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      if (task.job == null) {
        task.state = T("NOT RUN SINCE LAST BOOT");
      } else {
        task.state = task.job.state;
        this.job.getJobStatus(task.job.id).subscribe((t) => {
          t.state = t.job.state;
        });
      }

      return task;
    });
  }

  getActions(parentrow) {
    return [{
      actionName: parentrow.description,
      id: 'run_now',
      label: T("Run Now"),
      icon: 'play_arrow',
      onClick: (row) => {
        this.dialog.confirm(T("Run Now"), T("Run this cloud sync now?"), true).subscribe((res) => {
          if (res) {
            row.state = 'RUNNING';
            this.ws.call('cloudsync.sync', [row.id]).subscribe(
              (res) => {
                this.dialog.Info(T('Task started'), T('Cloud sync <i>') + row.description + T('</i> has started.'), '500px', 'info', true);
                this.job.getJobStatus(res).subscribe((task) => {
                  row.state = task.state;
                  row.job = task;
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this.entityList, err);
              })
          }
        });
      },
    }, {
      actionName: parentrow.description,
      id: 'stop',
      label: T("Stop"),
      icon: 'stop',
      onClick: (row) => {
        this.dialog.confirm(T("Stop"), T("Stop this cloud sync?"), true).subscribe((res) => {
          if (res) {
            this.ws.call('cloudsync.abort', [row.id]).subscribe(
              (wsRes) => {
                  this.dialog.Info(T('Task Stoped'), T('Cloud sync <i>') + row.description + T('</i> stopped.'), '500px', 'info', true);
              },
              (wsErr) => {
                new EntityUtils().handleWSError(this.entityList, wsErr);
              })
          }
        });
      },
    }, {
      id: "edit",
      actionName: parentrow.description,
      icon: 'edit',
      label: T("Edit"),
      onClick: (row) => {
        this.route_edit.push(row.id);
        this.router.navigate(this.route_edit);
      },
    }, {
      actionName: parentrow.description,
      id: "delete",
      label: T("Delete"),
      icon: 'delete',
      onClick: (row) => {
        this.entityList.doDelete(row);
      },
    }]
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'run_now' && row.job && row.job.state === 'RUNNING') {
      return false;
    } else if (actionId === 'stop' && (row.job? (row.job && row.job.state !== 'RUNNING') : true)) {
      return false;
    }
    return true;
  }

  stateButton(row) {
    if (row.job) {
      if (row.state === 'RUNNING') {
        this.entityList.runningStateButton(row.job.id);
      } else {
        this.job.showLogs(row.job.id);
      }
    } else {
      this.dialog.Info(globalHelptext.noLogDilaog.title, globalHelptext.noLogDilaog.message);
    }
  }
}
