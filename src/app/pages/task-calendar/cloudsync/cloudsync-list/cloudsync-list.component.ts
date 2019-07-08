import { WebSocketService, DialogService, JobService, EngineerModeService} from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { T } from '../../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
import { Moment } from 'moment';
import * as cronParser from 'cron-parser';
import { CloudsyncDetailsComponent } from './components/cloudsync-details.component';

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
  public entityList: any;
  protected asyncView = true;
  protected hasDetails = false;
  protected rowDetailComponent = CloudsyncDetailsComponent;

  public columns: Array < any > = [
    { name: T('Description'), prop: 'description' },
    { name: T('Path'), prop: 'path'},
    { name: T('Status'), prop: 'status', state: 'state'},
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Schedule'), prop: 'schedule', hidden: true },
    { name: T('Next Run'), prop: 'next_run', hidden: true },
    { name: T('Direction'), prop: 'direction', hidden: true},
    { name: T('Credential'), prop: 'credential', hidden: true },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cloud Sync Task',
      key_props: ['description']
    },
  };

  constructor(public router: Router,
              public ws: WebSocketService,
              public translateService: TranslateService,
              public dialog: DialogService,
              public job: JobService,
              protected engineerModeService: EngineerModeService) {
              }

  preInit(entityList) {
    if (localStorage.getItem('engineerMode') === 'true') {
      this.columns.splice(9, 0, { name: T('Auxiliary arguments'), prop: 'args' });
    }

    this.engineerModeService.engineerMode.subscribe((res) => {
      if (res === 'true') {
        this.columns.splice(9, 0, { name: T('Auxiliary arguments'), prop: 'args' });
      } else {
        if (this.columns.length === 12) {
          this.columns.splice(9, 1);
        }
      }
    });

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
      const row = entityList.rows[i];
      row.schedule = `${row.schedule.minute} ${row.schedule.hour} ${row.schedule.dom} ${row.schedule.month} ${row.schedule.dow}`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      row.next_run = ((cronParser.parseExpression(row.schedule, { iterator: true }).next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();

      row.credential = row.credentials['name'];
      if (row.job == null) {
        row.status = T("Not run since last boot");
      } else {
        row.state = row.job.state;
        row.status = row.job.state;
        if (row.job.error) {
          row.status += ":" + row.job.error;
        }
        this.job.getJobStatus(row.job.id).subscribe((task) => {
          row.state = row.job.state;
          row.status = task.state;
          if (task.error) {
            row.status += ":" + task.error;
          }
          if (task.progress.description && task.state !== 'SUCCESS') {
            row.status += ':' + task.progress.description;
          }
        });
      }
    }
  }

  stateButton(row) {
    this.job.showLogs(row.job.id);
  }
}
