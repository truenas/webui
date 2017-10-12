import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector : 'app-alertservice-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class AlertServiceListComponent {

  public title = "Alert Service";
  protected resource_name = 'system/ntpserver';
  protected route_delete: string[] = [ 'system', 'ntpservers', 'delete' ];
  protected route_success: string[] = [ 'system', 'ntpservers' ];
    
  public columns: Array<any> = [
    {name : 'Service Name', prop : 'name'},
    {name : 'Enabled', prop : 'enabled'},
  ];
    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
     protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}


  getAddActions() {
    let actions = [];
    actions.push({
      label: "AWS-SN",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "alertservice", "aws"]));
      }
    });

    return actions;
  }
}
