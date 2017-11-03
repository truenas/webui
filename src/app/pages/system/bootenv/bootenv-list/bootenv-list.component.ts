import {Component, ElementRef} from '@angular/core';
import {Router} from '@angular/router';
import filesize from 'filesize';

import {RestService} from '../../../../services/rest.service';

@Component({
  selector : 'app-bootenv-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class BootEnvironmentListComponent {

  public title = "Boot Environments";
  protected resource_name: string = 'system/bootenv';
  protected queryCall = 'bootenv.query';
  protected route_delete: string[] = [ 'system', 'bootenv', 'delete' ];
  protected entityList: any;
  protected wsActivate = 'bootenv.activate';
  protected wsKeep = 'bootenv.set_attribute';

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

  // rowValue(row, attr) {
  //   switch(attr) {
  //     case 'used':
  //       return filesize(row[attr]);
  //     case 'refer':
  //       return filesize(row[attr]);
  //     default:
  //       return row[attr];
  //   }
  // }


  rowValue(row, attr) {
    if (attr === 'created'){
      return row.created.$date
    }
    return row[attr];
  }

  constructor(_rest: RestService, private _router: Router) {}

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  isActionVisible(actionId: string, row: any) {
    if (actionId == 'edit' || actionId == 'add') {
      return false;
    }
    return true;
  }

  getActions(row) {
    let actions = [];
    if (row.active === '-'){
      actions.push({
        label : "Delete",
        id: "delete",
        onClick : (row) => {
          this.entityList.doDelete(row.id);
        }
      });
    }
    actions.push({
      label : "Clone",
      id: "clone",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "clone", row.id ]));
      }
    });
    actions.push({
      label : "Rename",
      id: "rename",
      onClick : (row) => {
        this._router.navigate(new Array('').concat(
            [ "system", "bootenv", "rename", row.id ]));
      }
    });
    actions.push({
      label : "Activate",
      id: "activate",
      onClick : (row) => {
        this.entityList.doActivate(row.id);
      }
    });
    if (row.keep === true){
      actions.push({
        label : "Unkeep",
        id: "keep",
        onClick : (row) => {
          this.entityList.toggleKeep(row.id, row.keep);
        }
      });

    } else {
      actions.push({
        label : "Keep",
        id: "keep",
        onClick : (row) => {
          this.entityList.toggleKeep(row.id, row.keep);
        }
      });
    }

    return actions;
  }
}
