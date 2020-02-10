import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';

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
  protected entityList: any;

  public wsMultiDelete = 'core.bulk';
  public multiActions: Array < any > = [
    {
      id: "mdelete",
      label: T("Delete"),
      icon: "delete",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    }
  ];

  public columns: Array < any > = [
    { name: T('Variable'), prop: 'var', always_display: true },
    { name: T('Value'), prop: 'value' },
    { name: T('Type'), prop: 'type' },
    { name: T('Description'), prop: 'comment' },
    { name: T('Enabled'), prop: 'enabled' },
  ];
  public rowIdentifier = 'var';

  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Tunable'),
      key_props: ['var']
    },
    multiSelect: true
  }

  constructor(protected router: Router, 
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector, 
    protected _appRef: ApplicationRef) {}

  preInit(entityList: any) {
    this.entityList = entityList;
    this.sub = this.aroute.params.subscribe(params => {});
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = [this.wsDelete];
    let selectedId = [];
    for (const i in selected) {
     selectedId.push([selected[i].id]);
    }
    params.push(selectedId);
    return params;
  }
}
