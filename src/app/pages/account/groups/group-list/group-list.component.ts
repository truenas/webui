import {Component} from '@angular/core';
import {Router} from '@angular/router';
import { T } from '../../../../translate-marker';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';

@Component({
  selector : 'app-group-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class GroupListComponent {
  public title = "Groups";
  protected resource_name = 'account/groups/';
  protected route_add: string[] = ['account', 'groups', 'add' ];
  protected route_add_tooltip = "Add Group";
  protected route_edit: string[] = [ 'account', 'groups', 'edit' ];
  protected route_delete: string[] = [ 'account', 'groups', 'delete' ];
  protected entityList: any;
  protected loaderOpen = false;
  public columns: Array<any> = [
    {name : 'Group', prop : 'bsdgrp_group', always_display: true},
    {name : 'GID', prop : 'bsdgrp_gid'},
    {name : 'Builtin', prop : 'bsdgrp_builtin'},
    {name : 'Permit Sudo', prop : 'bsdgrp_sudo'},
  ];
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
  };

  constructor(private _router: Router, protected dialogService: DialogService, protected loader: AppLoaderService,protected ws: WebSocketService) { }
  afterInit(entityList: any) { this.entityList = entityList; }
  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdgrp_builtin === true) {
      return false;
    }
    return true;
  }

  getActions(row) {
    const actions = [];
    actions.push({
      label : T("Members"),
      id: "members",
      onClick : (members) => {
        this._router.navigate(new Array('/').concat(
          [ "account", "groups", "members", members.id ]));
      }
    });
    if (row.bsdgrp_builtin === !true){
      actions.push({
        label : T("Edit"),
        id: "edit",
        onClick : (members_edit) => {
          this._router.navigate(new Array('/').concat(
            [ "account", "groups", "edit", members_edit.id ]));
        }
      })
      actions.push({
        label : T("Delete"),
        onClick : (members_delete) => {
          this.entityList.doDelete(members_delete.id );
        },
      });

    }

    return actions;
  }
  checkbox_confirm(id: any){
    const params = [id, {"delete_users": false}]
    const ds = this.dialogService.confirm(
      T("Delete"), 
      T("Delete this group?"), 
      false, T("Delete"),
      true,
      T('Delete all users with this primary group?'),
      'group.delete',
      params, 'delete-group');
    ds.afterClosed().subscribe((status)=>{
      if(status){
        this.loader.open();
        this.loaderOpen = true;
        this.ws.call(
          ds.componentInstance.method,ds.componentInstance.data).subscribe((res)=>{
            this.entityList.getData();
            this.loader.close();
          },
          (err)=>{
            this.entityList.getData();
            this.loader.close();
          }
        )
      }
    }
  );
  };
  checkbox_confirm_show(id: any){
    return true;
  }
}
