import {Component} from '@angular/core';
import {Router} from '@angular/router';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-group-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class GroupListComponent {

  constructor(private _router: Router) { }


  public title = "Groups";
  protected resource_name: string = 'account/groups/';
  protected route_add: string[] = ['account', 'groups', 'add' ];
  protected route_add_tooltip: string = "Add Group";
  protected route_edit: string[] = [ 'account', 'groups', 'edit' ];
  protected route_delete: string[] = [ 'account', 'groups', 'delete' ];
  protected entityList: any;

  afterInit(entityList: any) { this.entityList = entityList; }

  public columns: Array<any> = [
    {name : 'Group', prop : 'bsdgrp_group'},
    {name : 'GID', prop : 'bsdgrp_gid'},
    {name : 'Builtin', prop : 'bsdgrp_builtin'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdgrp_builtin === true) {
      return false;
    }
    return true;
  }

  getActions(row) {
    let actions = [];
    actions.push({
      label : T("Members"),
      id: "members",
      onClick : (row) => {
        this._router.navigate(new Array('/').concat(
          [ "account", "groups", "members", row.id ]));
      }
    });
    if (row.bsdgrp_builtin === !true){
      actions.push({
        label : T("Edit"),
        id: "edit",
        onClick : (row) => {
          this._router.navigate(new Array('/').concat(
            [ "account", "groups", "edit", row.id ]));
        }
      })
      actions.push({
        label : T("Delete"),
        onClick : (row) => {
          this.entityList.doDelete(row.id );
        },
      });

    }

    return actions;
  }
}
