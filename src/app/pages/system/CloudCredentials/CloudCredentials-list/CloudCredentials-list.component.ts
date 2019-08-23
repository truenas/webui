import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_cloudcredentials } from 'app/helptext/system/cloudcredentials';
import { WebSocketService } from '../../../../services/';

@Component({
  selector : 'app-cloudcredentials-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class CloudCredentialsListComponent {

  public title = "Cloud Credentials";
  protected queryCall = 'cloudsync.credentials.query';
  protected route_success: string[] = [ 'system', 'cloudcredentials' ];
  protected route_add: string[] = ['system', 'cloudcredentials', 'add'];
  protected route_add_tooltip: string = helptext_system_cloudcredentials.add_tooltip;
  protected route_edit: string[] = ['system', 'cloudcredentials', 'edit'];
  protected wsDelete = 'cloudsync.credentials.delete';

  public columns: Array<any> = [
    {name : 'Account Name', prop : 'name', always_display: true },
    {name : 'Provider', prop : 'provider'},
  ];
    public config: any = {
      paging : true,
      sorting : {columns : this.columns},
      deleteMsg: {
        title: 'Cloud Credential',
        key_props: ['name']
      },
    };

  constructor(protected router: Router, protected aroute: ActivatedRoute,
     protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}
}
