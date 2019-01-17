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
  protected queryCall = 'zfs.snapshot.query';
  protected route_add: string[] = ['storage', 'snapshots', 'add'];
  protected route_add_tooltip = "Add Snapshot";
  protected entityList: any;
  public busy: Subscription;
  public sub: Subscription;
  public columns: Array<any> = [
    {name : 'Name', prop : 'name', minWidth: 300},
    {name : 'Used', prop : 'used'},
    {name : 'Referenced', prop : 'refer'},
    {name : 'Date Created', prop: 'creation'}
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    multiSelect: true,
    deleteMsg: {
      title: 'Snapshot',
      key_props: ['fullname']
    },
  };

  protected wsMultiDelete = 'core.bulk';
  public multiActions: Array < any > = [
    {
      id: "mdelete",
      label: "Delete",
      icon: "delete",
      enable: true,
      ttpos: "above",
      onClick: (selected) => {
        this.entityList.doMultiDelete(selected);
      }
    }
  ];

  constructor(protected _router: Router, protected _route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) { }

  resourceTransformIncomingRestData(rows: any) {
    for (let i = 0; i < rows.length; i++) {
      rows[i].used = rows[i].properties.used.rawvalue;
      rows[i].refer = rows[i].properties.referenced.rawvalue;
      rows[i].creation = rows[i].properties.creation.value;
    }
    return rows;
  }
  
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
        this.entityList.doDelete(row1);
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
