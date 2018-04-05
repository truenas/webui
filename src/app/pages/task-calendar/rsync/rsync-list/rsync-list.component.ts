import { RestService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-rsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class RsyncListComponent {

  public title = "Rsync Tasks";
  protected resource_name = 'tasks/rsync';
  protected route_add: string[] = ['tasks', 'rsync', 'add'];
  protected route_add_tooltip = "Add Rsync Task";
  protected route_edit: string[] = ['tasks', 'rsync', 'edit'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Path', prop: 'rsync_path' },
    { name: 'Remote Host', prop: 'rsync_remotehost' },
    { name: 'Remote Module Name', prop: 'rsync_remotemodule' },
    { name: 'User', prop: 'rsync_user' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected rest: RestService, protected taskService: TaskService) {}

}
