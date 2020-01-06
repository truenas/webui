import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../../../services/';

@Component({
  selector: 'system-tunables-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})

export class TunableListComponent {

  public title = "Tunables";
  protected wsDelete = "tunable.delete";
  public queryCall:string = 'tunable.query';

  protected route_delete: string[] = ['system', 'tunable', 'delete'];
  protected route_edit: string[] = ['system', 'tunable', 'edit'];
  protected route_success: string[] = [ 'system', 'tunable' ];
  protected route_add: string[] = ["system", "tunable", "add"];
  protected route_add_tooltip = "Add Tunable";

  public busy: Subscription;
  public sub: Subscription;

  constructor(protected router: Router, 
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector, 
    protected _appRef: ApplicationRef) {}

  public columns: Array < any > = [
    { name: 'Variable', prop: 'var', always_display: true },
    { name: 'Value', prop: 'value' },
    { name: 'Type', prop: 'type' },
    { name: 'Description', prop: 'comment' },
    { name: 'Enabled', prop: 'enabled' },
  ];
  public rowIdentifier = 'var';

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Tunable',
      key_props: ['var']
    },
  }

  preInit(entityList: any) {
    this.sub = this.aroute.params.subscribe(params => {});
  }
}
