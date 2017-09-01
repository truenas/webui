import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-bootenv-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class BootEnvironmentListComponent {

  protected resource_name: string = 'system/bootenv';
  protected route_delete: string[] = [ 'system', 'bootenv', 'delete' ];

  public columns: Array<any> = [
    {name: 'Name', prop: 'name'},
    {name: 'Active', prop: 'active'},
    {name: 'Created', prop: 'created'},
    {name: 'Space', prop: 'space'},
    {name: 'Keep', prop: 'keep'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  /*rowValue(row, attr) {
    switch(attr) {
      case 'used':
        return filesize(row[attr]);
      case 'refer':
        return filesize(row[attr]);
      default:
        return row[attr];
    }
  }*/

  constructor(_rest: RestService, private _router: Router) {}

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label : "Delete",
      id: "delete",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "delete", row.id ]));
      }
    });
    actions.push({
      label : "Clone",
      id: "clone",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "clone", row.id ]));
      }
    });
    return actions;
  }
}
