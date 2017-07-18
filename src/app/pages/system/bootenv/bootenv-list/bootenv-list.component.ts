import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';

import {GlobalState} from '../../../../global.state';
import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-bootenv-list',
  template : `<entity-table [conf]="this"></entity-table>`
})
export class BootEnvironmentListComponent {

  protected resource_name: string = 'system/bootenv';
  protected route_delete: string[] = [ 'system', 'bootenv', 'delete' ];

  public columns: Array<any> = [
    {title : 'Name', name : 'name'},
    {title : 'Active', name : 'active'},
    {title : 'Created', name : 'created'},
    {title : 'Space', name : 'space'},
    {title : 'Keep', name : 'keep'},
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

  constructor(_rest: RestService, private _router: Router, _state: GlobalState,
              _eRef: ElementRef) {}

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
      onClick : (row) => {
        this._router.navigate(new Array('/pages').concat(
            [ "system", "bootenv", "delete", row.id ]));
      }
    });
    actions.push({
      label : "Clone",
      onClick : (row) => {
        this._router.navigate(new Array('/pages').concat(
            [ "system", "bootenv", "clone", row.id ]));
      }
    });
    return actions;
  }
}
