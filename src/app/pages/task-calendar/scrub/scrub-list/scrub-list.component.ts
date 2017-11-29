import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-scrub-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class ScrubListComponent {

  public title = "Scrub Tasks";
  protected resource_name = 'storage/scrub';
  protected route_add: string[] = ['tasks', 'scrub', 'add'];
  protected route_add_tooltip = "Add Scrub Task";
  protected route_edit: string[] = ['tasks', 'scrub', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Volume', prop: 'scrub_volume' },
    { name: 'Description', prop: 'scrub_description' },
    { name: 'Day of Week', prop: 'scrub_dayweek' },
    { name: 'Minute', prop: 'scrub_minute' },
    { name: 'Hour', prop: 'scrub_hour' },
    { name: 'Month', prop: 'scrub_month' },
    { name: 'Day of Month', prop: 'scrub_daymonth' },
    { name: 'Enabled', prop: 'scrub_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      let month_list: Array < string > = [];
      let months = entityList.rows[i].scrub_month.split(',');

      if (_.isEqual(entityList.rows[i].scrub_month, "*")) {
        entityList.rows[i].scrub_month = "Evey month";
      } else {
        this.taskService.getMonthChoices().subscribe((res) => {
          for (let i = 0; i < months.length; i++) {
            month_list.push(res[Number(months[i]) - 1][1]);
          }
          entityList.rows[i].scrub_month = _.join(month_list, ', ');
        });
      }

      let dayweeks_list: Array < string > = [];
      let dayweeks = entityList.rows[i].scrub_dayweek.split(',');
      
      if (_.isEqual(entityList.rows[i].scrub_dayweek, "*")) {
        entityList.rows[i].scrub_dayweek = "Eveyday";
      } else {
        this.taskService.getWeekdayChoices().subscribe((res) => {
          for (let i = 0; i < dayweeks.length; i++) {
            dayweeks_list.push(res[Number(dayweeks[i]) - 1][1]);
          }
          entityList.rows[i].scrub_dayweek = _.join(dayweeks_list, ', ');
        });
      }

      if (_.startsWith(entityList.rows[i].scrub_daymonth, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_daymonth, '*/'));
        entityList.rows[i].scrub_daymonth = "Evey " + N + " days";
      } else if (_.isEqual(entityList.rows[i].scrub_daymonth, "*")) {
        entityList.rows[i].scrub_daymonth = "Eveyday";
      }

      if (_.startsWith(entityList.rows[i].scrub_minute, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_minute, '*/'));
        entityList.rows[i].scrub_minute = "Evey " + N + " minutes";
      } else if (_.isEqual(entityList.rows[i].scrub_minute, "*")) {
        entityList.rows[i].scrub_minute = "Evey minute";
      }

      if (_.startsWith(entityList.rows[i].scrub_hour, '*/')) {
        let N = Number(_.trim(entityList.rows[i].scrub_hour, '*/'));
        entityList.rows[i].scrub_hour = "Evey " + N + " hours";
      } else if (_.isEqual(entityList.rows[i].scrub_hour, "*")) {
        entityList.rows[i].scrub_hour = "Evey hour";
      }
    }
  }
}
