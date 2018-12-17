import { RestService, DialogService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';
import { EntityUtils } from '../../../common/entity/utils';
import { T } from '../../../../translate-marker';

@Component({
  selector: 'app-cron-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class CronListComponent {

  public title = "Cron Jobs";
  protected resource_name = 'tasks/cronjob';
  protected route_add: string[] = ['tasks', 'cron', 'add'];
  protected route_add_tooltip = "Add Cron Job";
  protected route_edit: string[] = ['tasks', 'cron', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: T('Users'), prop: 'cron_user' },
    { name: T('Command'), prop: 'cron_command' },
    { name: T('Description'), prop: 'cron_description' },
    { name: T('Minute'), prop: 'cron_minute' },
    { name: T('Hour'), prop: 'cron_hour' },
    { name: T('Day of Month'), prop: 'cron_daymonth' },
    { name: T('Month'), prop: 'cron_month' },
    { name: T('Day of Week'), prop: 'cron_dayweek' },
    { name: T('Hide Stdout'), prop: 'cron_stdout', hidden: true },
    { name: T('Hide Stderr'), prop: 'cron_stderr', hidden: true },
    { name: T('Enabled'), prop: 'cron_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Cron Job',
      key_props: ['cron_user', 'cron_command', 'cron_description']
    },
  };

  protected month_choice: any;
  constructor(protected router: Router, protected rest: RestService, protected translate: TranslateService,
    protected taskService: TaskService, protected dialog: DialogService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  getActions(row) {
    const actions = [];
    actions.push({
      label : T("Run Now"),
      id: "run",
      onClick : (members) => {
        this.dialog.confirm(T("Run Now"), T("Run this cron job now?"), true).subscribe((run) => {
          if (run) {
            this.rest.post(this.resource_name + '/' + row.id + '/run/', {} ).subscribe((res) => {
              this.translate.get("close").subscribe((close) => {
                this.entityList.snackBar.open(res.data, close, { duration: 5000 });
              });
            }, (err) => {
              new EntityUtils().handleError(this, err);
            });
          }
        });
      }
    });
    actions.push({
      label : T("Edit"),
      id: "edit",
      onClick : (task_edit) => {
        this.router.navigate(new Array('/').concat(
          [ 'tasks', 'cron', 'edit', row.id ]));
      }
    })
    actions.push({
      label : T("Delete"),
      onClick : (task_delete) => {
        this.entityList.doDelete(row);
      },
    });

    return actions;
  }
}
