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
    { name: T('Schedule'), prop: 'cron', hidden: true, widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' }},
    { name: T('Next Run'), prop: 'next_run', hidden: true},
    { name: T('Minute'), prop: 'minute', hidden: true },
    { name: T('Hour'), prop: 'hour', hidden: true },
    { name: T('Day of Month'), prop: 'dom', hidden: true },
    { name: T('Month'), prop: 'month', hidden: true },
    { name: T('Day of Week'), prop: 'dow', hidden: true },
    { name: T('Status'), prop: 'status', state: 'state'},
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
        task.status = T("Not run since last boot");
      } else {
        task.state = task.job.state;
        task.status = task.job.state;
        if (task.job.error) {
          task.status += ":" + task.job.error;
        }
        this.job.getJobStatus(task.job.id).subscribe((t) => {
          t.state = t.job.state;
          t.status = t.state;
          if (t.error) {
            t.status += ":" + t.error;
          }
          if (t.progress.description && t.state !== 'SUCCESS') {
            t.status += ':' + t.progress.description;
          }
        });
      }

      return task;
    });
  }

  getActions(parentrow) {
    return [{
      id: parentrow.description,
      actionName: 'run_now',
      label: T("Run Now"),
      icon: 'play_arrow',
      onClick: (row) => {
        this.dialog.confirm(T("Run Now"), T("Run this cloud sync now?"), true).subscribe((res) => {
          if (res) {
            row.state = 'RUNNING';
            this.ws.call('cloudsync.sync', [row.id]).subscribe(
              (res) => {
                this.translateService.get("close").subscribe((close) => {
                  this.entityList.snackBar.open(T('Cloud sync has started.'), close, { duration: 5000 });
                });
                this.job.getJobStatus(res).subscribe((task) => {
                  row.state = task.state;
                  row.job = task;
                  row.status = task.state;
                  if (task.error) {
                    row.status += ":" + task.error;
                  }
                  if (task.progress.description && task.state != 'SUCCESS') {
                    row.status += ':' + task.progress.description;
                  }
                });
              },
              (err) => {
                new EntityUtils().handleWSError(this.entityList, err);
              })
          }
        });
      },
    }, {
      id: parentrow.description,
      actionName: 'stop',
      label: T("Stop"),
      icon: 'stop',
      onClick: (row) => {
        this.dialog.confirm(T("Stop"), T("Stop this cloud sync?"), true).subscribe((res) => {
          if (res) {
            this.ws.call('cloudsync.abort', [row.id]).subscribe(
              (wsRes) => {
                this.translateService.get("close").subscribe((close) => {
                  this.entityList.snackBar.open(T('Cloud sync stopped.'), close, { duration: 5000 });
                });
              },
              (wsErr) => {
                new EntityUtils().handleWSError(this.entityList, wsErr);
              })
          }
        });
      },
    }, {
      actionName: "edit",
      id: parentrow.description,
      icon: 'edit',
      label: T("Edit"),
      onClick: (row) => {
        this.route_edit.push(row.id);
        this.router.navigate(this.route_edit);
      },
    }, {
      id: parentrow.description,
      actionName: "delete",
      label: T("Delete"),
      icon: 'delete',
      onClick: (row) => {
        this.entityList.doDelete(row);
      },
    }]
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row.job && row.job.state === 'RUNNING') {
      return false;
    } else if (actionId === 'stop' && row.job && row.job.state !== 'RUNNING') {
      return false;
    }
    return true;
  }

  stateButton(row) {
    this.job.showLogs(row.job.id);
  }
}
