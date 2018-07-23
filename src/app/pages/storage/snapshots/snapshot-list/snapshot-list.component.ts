import { Component, ElementRef, Injector, ApplicationRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/rest.service';
import { Subscription } from 'rxjs';
import { WebSocketService } from '../../../../services';
import { T } from '../../../../translate-marker';


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
    {name : 'Fullname', prop : 'fullname'},
    {name : 'Used', prop : 'used'},
    {name : 'Refer', prop : 'refer'}
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true
  };

  protected wsMultiDelete = 'core.bulk';

  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }

  public multiActions: Array < any > = [
    // {
    //   id: "mdelete",
    //   label: "Delete",
    //   icon: "delete",
    //   enable: true,
    //   ttpos: "above",
    //   onClick: (selected) => {
    //     this.entityList.doMultiDelete(selected);
    //   }
    // } multidelete not available in the middleware
  ];

    public singleActions: Array < any > = [
      {
        label : T("Clone"),
        id: "clone",
        icon: "group",
        ttpos: "above",
        enable: true,
        onClick : (selected) => {
          this._router.navigate(new Array('/').concat(
            [ "storage", "snapshots", "clone", selected[0].id ]));
        }
  
      },
      {
        label : T("Rollback"),
        id: "rollback",
        icon: "keyboard_backspace",
        ttpos: "above",
        enable: true,
        onClick : (selected) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "snapshots", "rollback", selected[0].id]));
        }
      },
      { // doesnt seem to be the right delete function
        label : T("Delete"),
        id: "delete",
        icon: "delete",
        ttpos: "above",
        enable: true,
        onClick : (selected) => {
          console.log(selected)
          this.entityList.doDelete(selected[0].id );
        }
      }
    ];

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
          ["storage", "snapshots", "clone", row1.id]));
      }
    });
    if (parentRow.mostrecent) {
      actions.push({
        label: "Rollback",
        onClick: (row1) => {
          this._router.navigate(new Array('/').concat(
            ["storage", "snapshots", "rollback", row1.id]));
        }
      });
    }
    return actions;
  }

  getSelectedNames(selectedSnapshots) {
    let selected: any = [];
    for (let i in selectedSnapshots) {
      selected.push([{"dataset": selectedSnapshots[i].filesystem, "name": selectedSnapshots[i].name}]);
    }
    return selected;
  }

  wsMultiDeleteParams(selected: any) {
    let params: Array<any> = ['zfs.snapshot.remove'];
    params.push(this.getSelectedNames(selected));
    return params;
  }
}
