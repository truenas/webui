import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';

import { RestService } from '../../../../services';
import { TaskService } from '../../../../services';

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

  public columns: Array < any > = [
    { name: 'Pool', prop: 'scrub_volume' },
    { name: 'Threshold days', prop: 'scrub_threshold' },
    { name: 'Description', prop: 'scrub_description' },
    { name: 'Minute', prop: 'scrub_minute' },
    { name: 'Hour', prop: 'scrub_hour' },
    { name: 'Day of Month', prop: 'scrub_daymonth' },
    { name: 'Month', prop: 'scrub_month' },
    { name: 'Day of Week', prop: 'scrub_dayweek' },
    { name: 'Enabled', prop: 'scrub_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

  constructor(protected router: Router,
    protected rest: RestService,
    protected taskService: TaskService) {}

  public multiActions: Array < any > = [];

}

