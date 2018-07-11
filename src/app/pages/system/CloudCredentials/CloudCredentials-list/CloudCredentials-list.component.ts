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
  protected queryCall = 'cloudsync.credentials.query';
  protected route_success: string[] = [ 'system', 'cloudcredentials' ];
  protected route_add: string[] = ['system', 'cloudcredentials', 'add'];
  protected route_add_tooltip: string = T('Add Cloud Credential');
  protected route_edit: string[] = ['system', 'cloudcredentials', 'edit'];
  protected wsDelete = 'cloudsync.credentials.delete';

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
}
