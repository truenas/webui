import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-initshutdown-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class InitshutdownListComponent {

  public title = "Init/Shutdown Scripts"
  protected resource_name = 'tasks/initshutdown';
  protected route_add: string[] = ['tasks', 'initshutdown', 'add'];
  protected route_add_tooltip = "Add Init/Shutdown Scripts";
  protected route_edit: string[] = ['tasks', 'initshutdown', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Type', prop: 'ini_type' },
    { name: 'Command', prop: 'ini_command' },
    { name: 'Script', prop: 'ini_script' },
    { name: 'When', prop: 'ini_when' },
    { name: 'Enabled', prop: 'ini_enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected month_choice: any;
  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}
}
