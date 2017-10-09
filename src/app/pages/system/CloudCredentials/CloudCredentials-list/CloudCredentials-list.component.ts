import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector : 'app-cloudcredentials-list',
  template: `<entity-table [conf]="this"></entity-table>`
})
export class CloudCredentialsListComponent {
  protected queryCall = 'backup.credential.query';
  protected route_edit: string[] = [ 'system', 'cloudcredentials', 'gcs' ];
  protected route_success: string[] = [ 'system', 'cloudcredentials', 'gcs' ];
    
  public columns: Array<any> = [
    {name : 'Account Name', prop : 'name'},
    {name : 'Provider', prop : 'provider'},
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
      label: "GCS",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "cloudcredentials", "gcs"]));
      }
    });
    

    return actions;
  }
  getActions(row) {
    
    let actions = [];
    if (!row.type) {
      actions.push({
        label : "Delete",
        onClick : (row) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "gcs", row.id, "delete"]));}
      });
    }
    if(row.provider == "GCLOUD"){
      actions.push({
        label : "Edit",
        onClick : (row) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "gcs",row.id]));
        }
      });

    }
    return actions;
  }
}
