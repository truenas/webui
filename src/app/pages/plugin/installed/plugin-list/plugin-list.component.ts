import { Component, ElementRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { Subscription } from 'rxjs';

import { EntityListComponent } from '../../../common/entity/entity-list/';

@Component({
  selector: 'app-installed-plugin-list',
  template: `
  <entity-list [conf]="this"></entity-list>
  `
})
export class PluginListComponent {

  protected resource_name: string = 'plugins/plugins';
  protected entityList: EntityListComponent;

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService) {}

  public columns:Array<any> = [
    {title: 'Plugin name', name: 'plugin_name'},
    {title: 'Version', name: 'plugin_version'},
    {title: 'PBI', name: 'plugin_pbiname'},
    {title: 'Jail', name: 'plugin_jail'},
    {title: 'Service status', name: 'plugin_status'},
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  afterInit(entityList: EntityListComponent) {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'start' && row.plugin_status == "RUNNING") {
      return false;
    } else if (actionId == 'stop' && row.plugin_status == "STOPPED") {
      return false;
    }
    return true;
  }

  getActions(row) {
    return [
      {
        id: "start",
        label: "Start",
        onClick: (row) => {
          this.entityList.busy = this.rest.post(this.resource_name + '/' + row.id + '/start/', {
          }).subscribe((res) => {
            row.jail_status = 'Running';
          }, (res) => {
            console.log(res);
          });
        }
      },
      {
        id: "stop",
        label: "Stop",
        onClick: (row) => {
          this.entityList.busy = this.rest.post(this.resource_name + '/' + row.id + '/stop/', {
          }).subscribe((res) => {
            row.jail_status = 'Stopped';
          }, (res) => {
            console.log(res);
          });
        }
      },
      {
        id: "delete",
        label: "Delete",
        onClick: (row) => {
          this.router.navigate(new Array('/pages').concat(["plugins", "installed", "delete", row.id]));
        }
      }
    ]
  }

}
