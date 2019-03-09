import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-snapshot-task-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class SnapshotListComponent {

  public title = "Periodic Snapshot Tasks";
  protected resource_name = 'storage/task';
  protected route_add: string[] = ['tasks', 'snapshot', 'add'];
  protected route_add_tooltip = "Add Periodic Snapshot Task";
  protected route_edit: string[] = ['tasks', 'snapshot', 'edit'];
  protected dayweek: Array < any > = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  protected task_interval: Array < any > = [{
    label: '5 minutes',
    value: 5,
  }, {
    label: '10 minutes',
    value: 10,
  }, {
    label: '15 minutes',
    value: 15,
  }, {
    label: '30 minutes',
    value: 30,
  }, {
    label: '1 hour',
    value: 60,
  }, {
    label: '2 hours',
    value: 120,
  }, {
    label: '3 hours',
    value: 180,
  }, {
    label: '4 hours',
    value: 240,
  }, {
    label: '6 hours',
    value: 360,
  }, {
    label: '12 hours',
    value: 720,
  }, {
    label: '1 day',
    value: 1440,
  }, {
    label: '1 week',
    value: 10080,
  }, {
    label: '2 weeks',
    value: 20160,
  }, {
    label: '4 weeks',
    value: 40320,
  }];

  public columns: Array < any > = [
    { name: 'Pool/Dataset', prop: 'task_filesystem' },
    { name: 'Recursive', prop: 'task_recursive' },
    { name: 'When', prop: 'when' },
    { name: 'Frequency', prop: 'frequency' },
    { name: 'Keep snapshot for', prop: 'keepfor' },
    //{ name: 'VM sync', prop: 'vmwaresync' },
    { name: 'Enabled', prop: 'task_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Periodic Snapshot Task',
      key_props: ['task_filesystem', 'frequency']
    },
  };

  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}

  dataHandler(EntityTable: any) {
    for (let i = 0; i < EntityTable.rows.length; i++) {
      let task_dayweek = _.split(EntityTable.rows[i].task_byweekday, ',');
      let task_when_weekday: Array < any > = [];
      for (let j in task_dayweek) {
        task_when_weekday.push(this.dayweek[task_dayweek[j]]);
      }
      EntityTable.rows[i].when = 'From ' + EntityTable.rows[i].task_begin + ' to ' + EntityTable.rows[i].task_end + ' on every ' + _.join(task_when_weekday, ', ');
      EntityTable.rows[i].keepfor = EntityTable.rows[i].task_ret_count + ' ' + EntityTable.rows[i].task_ret_unit;
      EntityTable.rows[i].frequency = 'Every ' + _.find(this.task_interval, { value: EntityTable.rows[i].task_interval }).label;
    }
  }
}
