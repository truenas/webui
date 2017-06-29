import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { GlobalState } from '../../../../global.state';
import { RestService } from '../../../../services/rest.service';
import filesize from 'filesize';

@Component({
  selector: 'app-snapshot-list',
  template: `<entity-table [conf]="this"></entity-table>`
})
export class SnapshotListComponent {

  protected resource_name: string = 'storage/snapshot';
  protected route_delete: string[] = ['storage', 'snapshots', 'delete'];

  public columns:Array<any> = [
    {name: 'Fullname', prop: 'fullname'},
    {name: 'Used', prop: 'used'},
    {name: 'Refer', prop: 'refer'}
  ];
  public config:any = {
    paging: true,
    sorting: {columns: this.columns},
  };

  rowValue(row, attr) {
    switch(attr) {
      case 'used':
        return filesize(row[attr], {standard: "iec"});
      case 'refer':
        return filesize(row[attr], {standard: "iec"});
      default:
        return row[attr];
    }
  }

  constructor(_rest: RestService, private _router: Router, _state: GlobalState, _eRef: ElementRef) {
  }

  isActionVisible(actionId: string, row: any) {
    if(actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label: "Delete",
      onClick: (row) => {
        this._router.navigate(new Array('/pages').concat(["storage", "snapshots", "delete", row.id]));
      }
    });
    actions.push({
      label: "Clone",
      onClick: (row) => {
        this._router.navigate(new Array('/pages').concat(["storage", "snapshots", "clone", row.id]));
      }
    });
    if(row.mostrecent) {
      actions.push({
        label: "Rollback",
        onClick: (row) => {
          this._router.navigate(new Array('/pages').concat(["storage", "snapshots", "rollback", row.id]));
        }
      });
    }
    return actions;
  }

}
