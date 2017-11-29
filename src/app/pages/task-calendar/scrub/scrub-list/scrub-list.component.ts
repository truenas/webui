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

  public title = "Scrub Jobs";
  protected resource_name = 'tasks/scrubtask';
  protected route_add: string[] = ['tasks', 'scrub', 'add'];
  protected route_add_tooltip = "Add Scrub Job";
  protected route_edit: string[] = ['tasks', 'scrub', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected month_choice: any;
  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}

  dataHandler(entityList: any) {
    
  }
}
