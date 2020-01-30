import {Component} from '@angular/core';
import {Router} from '@angular/router';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';
import helptext from '../../../../helptext/account/group-list';
import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-group-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class GroupListComponent {
  public title = "Groups";
  protected queryCall = 'group.query';
  protected route_add: string[] = ['account', 'groups', 'add' ];
  protected route_add_tooltip = T("Add Group");
  protected route_edit: string[] = [ 'account', 'groups', 'edit' ];
  protected route_delete: string[] = [ 'account', 'groups', 'delete' ];
  protected entityList: any;
  protected loaderOpen = false;
  public columns: Array<any> = [
    {name : 'Group', prop : 'group', always_display: true},
    {name : 'GID', prop : 'gid'},
    {name : 'Builtin', prop : 'builtin'},
    {name : 'Permit Sudo', prop : 'sudo'},
    {name : 'Samba Authentication', prop: 'smb', hidden: true}
  ];
  public rowIdentifier = 'group';
  public config: any = {
    paging : true,
    sorting : {columns : this.columns},
    deleteMsg: {
      title: T('Group'),
      key_props: ['group']
    },
  };

  constructor(private _router: Router, protected dialogService: DialogService, protected loader: AppLoaderService,protected ws: WebSocketService) { }
  afterInit(entityList: any) { this.entityList = entityList; }
  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.builtin === true) {
      return false;
    }
    return true;
  }

  getActions(row) {
    const actions = [];
    actions.push({
      id: row.group,
      name: helptext.group_list_actions_id_member,
      label : helptext.group_list_actions_label_member,
      icon: 'people',
      onClick : (members) => {
        this._router.navigate(new Array('/').concat(
          [ "account", "groups", "members", members.id ]));
      }
    });
    if (row.builtin === !true){
      actions.push({
        id: row.group,
        icon: 'edit',
        label : helptext.group_list_actions_label_edit,
        name: helptext.group_list_actions_id_edit,
        onClick : (members_edit) => {
          this._router.navigate(new Array('/').concat(
            [ "account", "groups", "edit", members_edit.id ]));
        }
      })
      actions.push({
        id: row.group,
        icon: 'delete',
        name: 'delete',
        label : helptext.group_list_actions_label_delete,
        onClick : (members_delete) => {
          this.entityList.doDelete(members_delete);
        },
      });

    }

    return actions;
  }
  checkbox_confirm(id: any, deleteMsg: any){
    const params = [id, {"delete_users": false}]
    const ds = this.dialogService.confirm(
      helptext.group_list_dialog_label, 
      deleteMsg,
      false, helptext.group_list_dialog_label,
      true,
      helptext.group_list_dialog_message,
      'group.delete',
      params);
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
