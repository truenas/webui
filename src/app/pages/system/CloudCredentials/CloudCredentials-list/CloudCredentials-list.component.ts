import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { RestService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-cloudcredentials-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class CloudCredentialsListComponent {

  public title = "Cloud Credentials";
  protected queryCall = 'backup.credential.query';
  protected route_success: string[] = [ 'system', 'cloudcredentials' ];
  protected route_add: string[] = ['system', 'cloudcredentials', 'add'];
  protected route_add_tooltip: string = T('Add Cloud Credential');
  protected route_edit: string[] = ['system', 'cloudcredentials', 'edit'];
  protected wsDelete = 'backup.credential.delete';

  public columns: Array<any> = [
    {name : 'Account Name', prop : 'name'},
    {name : 'Provider', prop : 'provider'},
  ];
    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
    };

  protected providerMap: Array<any> = [
    {
      label: 'Amazon AWS',
      value: 'AMAZON',
    }, {
      label: 'Microsoft Azure',
      value: 'AZURE',
    }, {
      label: 'Backblaze B2',
      value: 'BACKBLAZE',
    }, {
      label: 'Google Cloud',
      value: 'GCLOUD',
    }
  ];
  constructor(protected router: Router, protected aroute: ActivatedRoute,
     protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  dataHandler(entityList: any) {
    for (let i = 0; i < entityList.rows.length; i++) {
      entityList.rows[i].provider = _.find(this.providerMap, {value: entityList.rows[i].provider}).label;
    }
  }
}
