import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

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
    { name: 'Users', prop: 'cron_user' },
    { name: 'Command', prop: 'cron_command' },
    { name: 'Description', prop: 'cron_description' },
    { name: 'Minute', prop: 'cron_minute' },
    { name: 'Hour', prop: 'cron_hour' },
    { name: 'Day of Month', prop: 'cron_daymonth' },
    { name: 'Month', prop: 'cron_month' },
    { name: 'Day of Week', prop: 'cron_dayweek' },
    { name: 'Redirect Stdout', prop: 'cron_stdout' },
    { name: 'Redirect Stderr', prop: 'cron_stderr' },
    { name: 'Enabled', prop: 'cron_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected month_choice: any;
  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}

}
