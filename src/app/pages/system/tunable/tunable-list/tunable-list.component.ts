import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector: 'system-tunables-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class TunableListComponent {

  public title = "Tunables";
  protected resource_name: string = 'system/tunable';
  protected route_delete: string[] = ['system', 'tunable', 'delete'];
  protected route_edit: string[] = ['system', 'tunable', 'edit'];
  protected route_success: string[] = [ 'system', 'tunable' ];
  protected route_add: string[] = ["system", "tunable", "add"];
  protected route_add_tooltip = "Add Tunable";

  public busy: Subscription;
  public sub: Subscription;

  constructor(protected router: Router, protected aroute: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  public columns: Array < any > = [
    { name: 'Variable', prop: 'tun_var', always_display: true },
    { name: 'Value', prop: 'tun_value' },
    { name: 'Type', prop: 'tun_type' },
    { name: 'Description', prop: 'tun_comment' },
    { name: 'Enabled', prop: 'tun_enabled' },
  ];
  public rowIdentifier = 'tun_var';

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Tunable',
      key_props: ['tun_var']
    },
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {});
  }
}
