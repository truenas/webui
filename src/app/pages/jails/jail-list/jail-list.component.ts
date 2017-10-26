import { RestService, WebSocketService } from '../../../services';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-jail-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class JailListComponent {

  public title = "Instances";
  protected queryCall = 'jail.query';
  protected route_add: string[] = ['jails', 'add'];
  protected route_add_tooltip = "Add Jail";
  protected wsDelete = 'jail.do_delete';
  protected entityList: any;

  public columns: Array < any > = [
    { name: 'Jail', prop: 'host_hostuuid' },
    { name: 'Status', prop: 'state' },
    { name: 'Release', prop: 'release' },
    { name: 'IPv4 Address', prop: 'ip4_addr' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected rest: RestService, protected ws: WebSocketService, protected loader: AppLoaderService) {}

  afterInit(entityList: any) { this.entityList = entityList; }

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'start' && row.state === "up") {
      return false;
    } else if (actionId === 'stop' && row.state === "down") {
      return false;
    }
    return true;
  }

  getActions(parentRow) {
    return [{
        id: "edit",
        label: "Edit",
        onClick: (row) => {
          console.log(row.host_hostuuid);
          this.router.navigate(
            new Array('').concat(["jails", "edit", row.host_hostuuid]));
        }
      },
      {
        id: "start",
        label: "Start",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.start', [row.host_hostuuid]).subscribe(
              (res) => { row.state = 'up'; },
              (res) => { console.log(res); });
        }
      },
      {
        id: "stop",
        label: "Stop",
        onClick: (row) => {
          this.entityList.busy =
            this.ws.call('jail.stop', [row.host_hostuuid]).subscribe(
              (res) => { row.state = 'down'; },
              (res) => { console.log(res); });
        }
      },
      {
        id: "update",
        label: "Update",
        onClick: (row) => {
          this.loader.open();
          this.entityList.busy =
            this.ws.job('jail.update_to_latest_patch', [row.host_hostuuid]).subscribe(
              (res) => {
                console.log(res);
                this.loader.close();
              });
        }
      },
      {
        id: "delete",
        label: "Delete",
        onClick: (row) => {
          this.entityList.doDelete(row.host_hostuuid);
        }
      }
    ]
  }
}
