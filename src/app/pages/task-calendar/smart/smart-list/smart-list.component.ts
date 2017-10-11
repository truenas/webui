import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-smart-list',
  template: `<entity-table [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class SmartListComponent {

  protected resource_name = 'tasks/smarttest';
  protected route_add: string[] = ['tasks', 'smart', 'add'];
  protected route_add_tooltip = "Add S.M.A.R.T Test";
  protected route_edit: string[] = ['tasks', 'smart', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Type', prop: 'smarttest_type' },
    { name: 'Short Description', prop: 'smarttest_desc' },
    { name: 'Hour', prop: 'smarttest_hour' },
    { name: 'Day of Month', prop: 'smarttest_daymonth' },
    { name: 'Month', prop: 'smarttest_month' },
    { name: 'Day of Week', prop: 'smarttest_dayweek' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected month_choice: any;
  protected type_choice: any;

  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {
    this.taskService.getSmarttestTypeChoices().subscribe((res) => {
      this.type_choice = res;
    });
  }

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      for (let j = 0; j < this.type_choice.length; j++) {
        if (this.type_choice[j][0] == entityList.rows[i].smarttest_type) {
          entityList.rows[i].smarttest_type = this.type_choice[j][1];
        }
      }

      let month_list: Array < string > = [];
      let months = entityList.rows[i].smarttest_month.split(',');

      if (_.isEqual(entityList.rows[i].smarttest_month, "*")) {
        entityList.rows[i].smarttest_month = "Evey month";
      } else {
        this.taskService.getMonthChoices().subscribe((res) => {
          for (let i = 0; i < months.length; i++) {
            month_list.push(res[Number(months[i]) - 1][1]);
          }
          entityList.rows[i].smarttest_month = _.join(month_list, ', ');
        });
      }

      let dayweeks_list: Array < string > = [];
      let dayweeks = entityList.rows[i].smarttest_dayweek.split(',');
      if (_.isEqual(entityList.rows[i].smarttest_dayweek, "*")) {
        entityList.rows[i].smarttest_dayweek = "Eveyday";
      } else {
        this.taskService.getWeekdayChoices().subscribe((res) => {
          for (let i = 0; i < dayweeks.length; i++) {
            dayweeks_list.push(res[Number(dayweeks[i]) - 1][1]);
          }
          entityList.rows[i].smarttest_dayweek = _.join(dayweeks_list, ', ');
        });
      }

      if (_.startsWith(entityList.rows[i].smarttest_daymonth, '*/')) {
        let N = Number(_.trim(entityList.rows[i].smarttest_daymonth, '*/'));
        entityList.rows[i].smarttest_daymonth = "Evey " + N + " days";
      } else if (_.isEqual(entityList.rows[i].smarttest_daymonth, "*")) {
        entityList.rows[i].smarttest_daymonth = "Eveyday";
      }

      if (_.startsWith(entityList.rows[i].smarttest_minute, '*/')) {
        let N = Number(_.trim(entityList.rows[i].smarttest_minute, '*/'));
        entityList.rows[i].smarttest_minute = "Evey " + N + " minutes";
      } else if (_.isEqual(entityList.rows[i].smarttest_minute, "*")) {
        entityList.rows[i].smarttest_minute = "Evey minute";
      }

      if (_.startsWith(entityList.rows[i].smarttest_hour, '*/')) {
        let N = Number(_.trim(entityList.rows[i].smarttest_hour, '*/'));
        entityList.rows[i].smarttest_hour = "Evey " + N + " hours";
      } else if (_.isEqual(entityList.rows[i].smarttest_hour, "*")) {
        entityList.rows[i].smarttest_hour = "Evey hour";
      }
    }
  }
}
