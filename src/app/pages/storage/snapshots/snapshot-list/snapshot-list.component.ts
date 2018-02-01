import { Component, ElementRef, Injector, ApplicationRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/rest.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'app-snapshot-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SnapshotListComponent {

  public title = "Snapshots";
  protected resource_name = 'storage/snapshot';
  protected route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = "Add Snapshot";
  protected entityList: any;
  public busy: Subscription;
  public sub: Subscription;
  public columns: Array<any> = [
    {name : 'Fullname', prop : 'fullname'}, {name : 'Used', prop : 'used'},
    {name : 'Refer', prop : 'refer'}
  ];


  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }

  rowValue(row, attr) {
    switch (attr) {
      case 'used':
        return (<any>window).filesize(row[attr], { standard: "iec" });
      case 'refer':
        return (<any>window).filesize(row[attr], { standard: "iec" });
      default:
        return row[attr];
    }
  }
  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  preInit(entityList: any) {
    this.sub = this._route.params.subscribe(params => { });
  }


  getActions(parentRow) {
    const actions = [];
    
    actions.push({
      label: "Delete",
      onClick: (row1) => {
        this.entityList.doDelete(row1.id);
      }
    });
    actions.push({
      label: "Clone",
      onClick: (row1) => {
        this._router.navigate(new Array('/').concat(
          ["storage", "snapshot", "clone", row1.id]));
      }
    });
    if (parentRow.mostrecent) {
      actions.push({
        label: "Rollback",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "snapshot", "rollback", row1.id]));
        }
      });
    }
    return actions;
  }

  
}
