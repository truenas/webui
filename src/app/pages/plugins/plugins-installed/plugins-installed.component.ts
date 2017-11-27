import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { RestService, WebSocketService } from '../../../services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-plugins-installed-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class PluginsInstalledListComponent {

  public title = "Installed Plugins";
  protected queryCall = 'jail.list_resource';
  protected queryCallOption = ["PLUGIN"];
  protected wsDelete = 'jail.do_delete';
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Name', prop: '1' },
    { name: 'Boot', prop: '2' },
    { name: 'State', prop: '3' },
    { name: 'Type', prop: '4' },
    { name: 'Release', prop: '5' },
    { name: 'IP4 address', prop: '6' },
    { name: 'IP6 address', prop: '7' },
    { name: 'Template', prop: '8' }
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row[3] === "up") {
      return false;
    } else if (actionId === 'stop' && row[3] === "down") {
      return false;
    }
    return true;
  }

  getActions(parentRow) {
    return [{
        id: "start",
        label: "Start",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.start', [row[1]]).subscribe(
              (res) => { row[3] = 'up'; },
              (res) => { console.log(res); });
        }
      },
      {
        id: "stop",
        label: "Stop",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.stop', [row[1]]).subscribe(
              (res) => { row[3] = 'down'; },
              (res) => { console.log(res); });
        }
      },
      {
        id: "delete",
        label: "Delete",
        onClick: (row) => {
          this.entityList.doDelete(row[1]);
        }
      }
    ]
  }
}
