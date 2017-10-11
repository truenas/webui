import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import {Observable} from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector : 'app-alertservice-list',
  template: `<entity-table [conf]="this"></entity-table>`
})
export class AlertServiceListComponent {
  protected resource_name = 'system/consulalerts';
  protected route_edit: string[] = [ 'system', 'alertservice', 'edit-aws' ];
  protected route_add: string[] = [ 'system', 'alertservice', 'add-aws' ];
  protected route_success: string[] = [ 'system', 'alertservice' ];
  
  public busy: Subscription;
  public sub: Subscription;

  public columns: Array<any> = [
    {name : 'Service Name', prop : 'consulalert_type'},
    {name : 'Enabled', prop : 'enabled'},
  ];
    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
     protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}


  getAddActions() {
    let actions = [];
    actions.push({
      label: "AWS-SN",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "alertservice", "add-aws"]));
      }
    });

    return actions;
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {});
  }
 
  getAlertList(): Observable<Array<any>> {
    return this.rest.get(this.resource_name, {});
  }
}
