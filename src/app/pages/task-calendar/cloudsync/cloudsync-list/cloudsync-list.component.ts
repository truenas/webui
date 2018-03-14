import { WebSocketService } from '../../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { TaskService } from '../../../../services/';

@Component({
  selector: 'app-cloudsync-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [TaskService]
})
export class CloudsyncListComponent {

  public title = "Cloud Sync Jobs";
  protected queryCall = 'backup.query';
  protected route_add: string[] = ['tasks', 'cloudsync', 'add'];
  protected route_add_tooltip = "Add Cloud Sync Job";
  protected route_edit: string[] = ['tasks', 'cloudsync', 'edit'];
  protected route_delete: string[] = ['tasks', 'cloudsync', 'delete'];
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Description', prop: 'description' },
    { name: 'Direction', prop: 'direction'},
    { name: 'Path', prop: 'path'},
    { name: 'Minute', prop: 'minute' },
    { name: 'Hour', prop: 'hour' },
    { name: 'Day of Month', prop: 'daymonth' },
    { name: 'Month', prop: 'month' },
    { name: 'Day of Week', prop: 'dayweek' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  protected month_choice: any;
  constructor(protected router: Router, protected ws: WebSocketService, protected taskService: TaskService) {
    this.ws.call('backup.query',{}).subscribe( res => {
    })
  }

  getActions(row) {
    let actions = [];
    if (!row.type) {
      actions.push({
        label : "Edit",
        onClick : (row) => {
          this.router.navigate(new Array('/').concat(['tasks', 'cloudsync', 'edit', row.id]));}
      });
    }
    if (!row.type) {
      actions.push({
        label : "Delete",
        onClick : (row) => {
          this.router.navigate(new Array('/').concat(["tasks", "cloudsync", "delete", row.id]));}
      });
    }
    return actions;
  }
}
