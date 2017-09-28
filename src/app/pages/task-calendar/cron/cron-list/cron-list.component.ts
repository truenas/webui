import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-cron-list',
  template: `<entity-table [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class CronListComponent {

  protected resource_name = 'tasks/cronjob';
  protected route_add: string[] = ['tasks', 'cron', 'add'];
  protected route_add_tooltip = "Add Cron Job";
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

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      let month_list: Array < string > = [];
      let months = entityList.rows[i].cron_month.split(',');

      if (_.isEqual(entityList.rows[i].cron_month, "*")) {
        entityList.rows[i].cron_month = "Evey month";
      } else {
        this.taskService.getMonthChoices().subscribe((res) => {
          for (let i = 0; i < months.length; i++) {
            month_list.push(res[Number(months[i]) - 1][1]);
          }
          entityList.rows[i].cron_month = _.join(month_list, ', ');
        });
      }

      let dayweeks_list: Array < string > = [];
      let dayweeks = entityList.rows[i].cron_dayweek.split(',');
      if (_.isEqual(entityList.rows[i].cron_dayweek, "*")) {
        entityList.rows[i].cron_dayweek = "Eveyday";
      } else {
        this.taskService.getWeekdayChoices().subscribe((res) => {
          for (let i = 0; i < dayweeks.length; i++) {
            dayweeks_list.push(res[Number(dayweeks[i]) - 1][1]);
          }
          entityList.rows[i].cron_dayweek = _.join(dayweeks_list, ', ');
        });
      }

      if (_.startsWith(entityList.rows[i].cron_daymonth, '*/')) {
        let N = Number(_.trim(entityList.rows[i].cron_daymonth, '*/'));
        entityList.rows[i].cron_daymonth = "Evey " + N + " days";
      } else if (_.isEqual(entityList.rows[i].cron_daymonth, "*")) {
        entityList.rows[i].cron_daymonth = "Eveyday";
      }

      if (_.startsWith(entityList.rows[i].cron_minute, '*/')) {
        let N = Number(_.trim(entityList.rows[i].cron_minute, '*/'));
        entityList.rows[i].cron_minute = "Evey " + N + " minutes";
      } else if (_.isEqual(entityList.rows[i].cron_minute, "*")) {
        entityList.rows[i].cron_minute = "Evey minute";
      }

      if (_.startsWith(entityList.rows[i].cron_hour, '*/')) {
        let N = Number(_.trim(entityList.rows[i].cron_hour, '*/'));
        entityList.rows[i].cron_hour = "Evey " + N + " hours";
      } else if (_.isEqual(entityList.rows[i].cron_hour, "*")) {
        entityList.rows[i].cron_hour = "Evey hour";
      }
    }
  }
}
