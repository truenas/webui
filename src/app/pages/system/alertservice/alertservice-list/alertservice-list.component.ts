import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector: 'app-alertservice-list',
  template: `<entity-table [conf]="this"></entity-table>`
})
export class AlertServiceListComponent {
  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = ['system', 'alertservice'];
  protected entityList: any;

  public busy: Subscription;
  public sub: Subscription;

  public columns: Array<any> = [
    { name: 'Service Name', prop: 'consulalert_type' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }


  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => { });
  }

  getAddActions() {
    return [{
      label: "AWS-SNS",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "alertservice", "add-aws"]));
      }
    },{
      label: "HipChat",
      icon: "system_update_alt",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "alertservice", "add-hipchat"]));
      }
    },{
      label: "InfluxDB",
      icon: "vpn_lock",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "alertservice", "add-influxdb"]));
      }
    },{
        label: "Mattermost",
        icon: "vpn_lock",
        onClick: () => {
          this.router.navigate(
            new Array('').concat(["system", "alertservice", "add-mattermost"]));
        }
    }];
  }

  getActions(parentRow) {
    return [{
      id: "edit",
      label: "Edit",
      onClick: (row) => {

        if (row.consulalert_type === "AWSSNS") {
          const urlNav = new Array<String>('').concat(['system', 'alertservice', 'edit-aws', row.id]);
          this.router.navigate(urlNav);
        } else if (row.consulalert_type === "HipChat") {
          const urlNav = new Array<String>('').concat(['system', 'alertservice', 'edit-hipchat', row.id]);
          this.router.navigate(urlNav);
        } else if (row.consulalert_type === "InfluxDB") {
          const urlNav = new Array<String>('').concat(['system', 'alertservice', 'edit-influxdb', row.id]);
          this.router.navigate(urlNav);
        } else if (row.consulalert_type === "Mattermost") {
          const urlNav = new Array<String>('').concat(['system', 'alertservice', 'edit-mattermost', row.id]);
          this.router.navigate(urlNav);
        }
      }
    },
    {
      id: "delete",
      label: "Delete",
      onClick: (row) => {
        this.entityList.doDelete(row.id);
      }
    }
    ]
  }

}
