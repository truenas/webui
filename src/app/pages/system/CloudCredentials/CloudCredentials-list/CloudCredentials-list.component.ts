import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';


@Component({
  selector : 'app-cloudcredentials-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class CloudCredentialsListComponent {

  public title = "Cloud Credentials";
  protected queryCall = 'backup.credential.query';
  protected route_edit: string[] = [ 'system', 'cloudcredentials', 'gcs' ];
  protected route_success: string[] = [ 'system', 'cloudcredentials', 'gcs' ];
  protected entityList: any;
  protected wsDelete = 'backup.credential.delete'

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

afterInit(entityList: any) {
      this.entityList = entityList;
    }

  getAddActions() {
    const actions = [];
    actions.push({
      label: "GCLOUD",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "cloudcredentials", "gcs"]));
      }
    });
    actions.push({
      label: "AMAZON",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "cloudcredentials", "amazon"]));
      }
    });
    actions.push({
      label: "BACKBLAZE",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "cloudcredentials", "b2"]));
      }
    });
    actions.push({
      label: "AZURE",
      icon: "card_membership",
      onClick: () => {
        this.router.navigate(
          new Array('').concat(["system", "cloudcredentials", "azure"]));
      }
    });

    return actions;
  }
  getActions(row) {
    
    const actions = [];
    if (!row.type) {
      actions.push({
        label : "Delete",
        onClick : (Delete) => {
          this.entityList.doDelete(row.id)
          // this.router.navigate(new Array('/').concat(["system", "cloudcredentials", row.id, "delete"]));
        }
      });
    }
    if(row.provider === "GCLOUD"){
      actions.push({
        label : "Edit",
        onClick : (GCLOUD) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "gcs",row.id]));
        }
      });
    }
    if(row.provider === "AMAZON"){
      actions.push({
        label : "Edit",
        onClick : (AMAZON) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "amazon",row.id]));
        }
      });
    }
    if(row.provider === "AZURE"){
      actions.push({
        label : "Edit",
        onClick : (AZURE) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "azure",row.id]));
        }
      });
    }
    if(row.provider === "BACKBLAZE"){
      actions.push({
        label : "Edit",
        onClick : (BACKBLAZE) => {
          this.router.navigate(new Array('/').concat(["system", "cloudcredentials", "b2",row.id]));
        }
      });
    }
    return actions;
  }
}
