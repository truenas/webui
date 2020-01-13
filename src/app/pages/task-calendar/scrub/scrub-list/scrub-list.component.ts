import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { WebSocketService } from '../../../../services';
import { TaskService } from '../../../../services/';
import * as cronParser from 'cron-parser';
import { Moment } from 'moment';
import { TaskScheduleListComponent } from '../../components/task-schedule-list/task-schedule-list.component';


@Component({
  selector: 'app-scrub-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class ScrubListComponent {

  public title = "Scrub Tasks";
  //protected resource_name = 'storage/scrub';
  public queryCall:string = 'pool.scrub.query';
  protected wsDelete: string = 'pool.scrub.delete';
  protected route_add: string[] = ['tasks', 'scrub', 'add'];
  protected route_add_tooltip = "Add Scrub Task";
  protected route_edit: string[] = ['tasks', 'scrub', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Pool', prop: 'pool_name', always_display: true },
    { name: 'Threshold days', prop: 'threshold' },
    { name: 'Description', prop: 'description' },
    { name: 'Schedule', prop: 'schedule', widget: { icon: 'calendar-range', component: 'TaskScheduleListComponent' } },
    { name: 'Next Run', prop: 'next_run' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Scrub Task',
      key_props: ['pool_name']
    },
  };

  constructor(protected router: Router,
    protected ws: WebSocketService,
    protected taskService: TaskService) {}

  resourceTransformIncomingRestData(data: any): any {
    for (const task of data) {
      task.schedule = `${task.schedule.minute} ${task.schedule.hour} ${task.schedule.dom} ${task.schedule.month} ${
        task.schedule.dow
      }`;

      /* Weird type assertions are due to a type definition error in the cron-parser library */
      task.scrub_next_run = ((cronParser
        .parseExpression(task.schedule, { iterator: true })
        .next() as unknown) as {
        value: { _date: Moment };
      }).value._date.fromNow();
    }
    return data;
  }
}
