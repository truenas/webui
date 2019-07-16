import { WebSocketService, DialogService, JobService, EngineerModeService} from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [JobService],
})
export class CloudsyncListComponent {

  public title = "Cloud Sync Tasks";
  protected queryCall = 'cloudsync.query';
  protected route_add: string[] = ['tasks', 'cloudsync', 'add'];
  protected route_add_tooltip = "Add Cloud Sync Task";
  protected route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  protected wsDelete = "cloudsync.delete";
  protected entityList: any;
  protected asyncView = true;

  public columns: Array < any > = [
    { name: T('Description'), prop: 'description' },
    { name: T('Credential'), prop: 'credential', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true},
    { name: T('Path'), prop: 'path', hidden: true},
    { name: T('Schedule'), prop: 'cron', hidden: true},
    { name: T('Next Run'), prop: 'next_run', hidden: true},
    { name: T('Minute'), prop: 'minute', hidden: true },
    { name: T('Hour'), prop: 'hour', hidden: true },
    { name: T('Day of Month'), prop: 'dom', hidden: true },
    { name: T('Month'), prop: 'month', hidden: true },
    { name: T('Day of Week'), prop: 'dow', hidden: true },
    { name: T('Status'), prop: 'status', state: 'state'},
    { name: T('Enabled'), prop: 'enabled' },
  ];
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
              protected job: JobService,
              protected engineerModeService: EngineerModeService) {
              }

  preInit(entityList) {
    if (localStorage.getItem('engineerMode') === 'true') {
      this.columns.splice(9, 0, { name: T('Auxiliary arguments'), prop: 'args' });
    }
    // const argsColumn = _.find(this.detailColumns, {prop: 'args'});
    // this.engineerModeService.engineerMode.subscribe((res) => {
    //   argsColumn.isHidden = res === 'true' ? false : true;
    // });

  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(parentrow) {
    return [{
      id: "start",
      label: T("Run Now"),
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
      id: "stop",
      label: T("Stop"),
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
      id: "edit",
      label: T("Edit"),
      onClick: (row) => {
        this.route_edit.push(row.id);
        this.router.navigate(this.route_edit);
      },
    }, {
      id: "delete",
      label: T("Delete"),
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

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].minute = entityList.rows[i].schedule['minute'];
      entityList.rows[i].hour = entityList.rows[i].schedule['hour'];
      entityList.rows[i].dom = entityList.rows[i].schedule['dom'];
      entityList.rows[i].month = entityList.rows[i].schedule['month'];
      entityList.rows[i].dow = entityList.rows[i].schedule['dow'];
      entityList.rows[i].credential = entityList.rows[i].credentials['name'];
      
      entityList.rows[i].cron = `${entityList.rows[i].minute} ${entityList.rows[i].hour} ${entityList.rows[i].dom} ${entityList.rows[i].month} ${entityList.rows[i].dow}`;
      
      /* Weird type assertions are due to a type definition error in the cron-parser library */
      entityList.rows[i].next_run = ((cronParser.parseExpression(entityList.rows[i].cron, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      if (entityList.rows[i].job == null) {
        entityList.rows[i].status = T("Not run since last boot");
      } else {
        entityList.rows[i].state = entityList.rows[i].job.state;
        entityList.rows[i].status = entityList.rows[i].job.state;
        if (entityList.rows[i].job.error) {
          entityList.rows[i].status += ":" + entityList.rows[i].job.error;
        }
        this.job.getJobStatus(entityList.rows[i].job.id).subscribe((task) => {
          entityList.rows[i].state = entityList.rows[i].job.state;
          entityList.rows[i].status = task.state;
          if (task.error) {
            entityList.rows[i].status += ":" + task.error;
          }
          if (task.progress.description && task.state != 'SUCCESS') {
            entityList.rows[i].status += ':' + task.progress.description;
          }
        });
      }
    }

  }

  stateButton(row) {
    this.job.showLogs(row.job.id);
  }
}
