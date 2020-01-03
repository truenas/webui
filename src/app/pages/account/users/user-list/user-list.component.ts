import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { T } from '../../../../translate-marker';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';
import * as _ from 'lodash';
import helptext from '../../../../helptext/account/user-list';

@Component({
  selector: 'app-user-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class UserListComponent implements OnInit {

  public title = "Users";
  protected route_add: string[] = ['account', 'users', 'add'];
  protected route_add_tooltip = "Add User";
  protected route_edit: string[] = ['account', 'users', 'edit'];
  protected route_delete: string[] = ['account', 'users', 'delete'];
  protected entityList: any;
  protected loaderOpen = false;
  protected usr_lst = [];
  protected grp_lst = [];
  protected hasDetails = true;
  protected queryCall = 'user.query';

  public columns: Array < any > = [
    { name: 'Username', prop: 'username', always_display: true, minWidth: 150},
    { name: 'UID', prop: 'uid', hidden: false, maxWidth: 100 },
    { name: 'GID', prop: 'gid', hidden: true, maxWidth: 100 },
    { name: 'Home directory', prop: 'home', hidden: true  },
    { name: 'Shell', prop: 'shell', hidden: true, minWidth: 150  },
    { name: 'Builtin', prop: 'builtin', hidden: false  },
    { name: 'Full Name', prop: 'full_name', hidden: false, minWidth: 250 },
    { name: 'Email', prop: 'email', hidden: true, maxWidth: 250 },
    { name: 'Disable Password Login', prop: 'password_disabled', hidden: true, minWidth: 200 },
    { name: 'Lock User', prop: 'locked', hidden: true },
    { name: 'Permit Sudo', prop: 'sudo', hidden: true  },
    { name: 'Microsoft Account', prop: 'microsoft_account', hidden: true, minWidth: 170 },
  ];
  public rowIdentifier = 'bsdusr_username';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'User',
      key_props: ['bsdusr_username']
    }
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdusr_builtin === true) {
      return false;
    }
    return true;
  }

  constructor(private router: Router,
              protected dialogService: DialogService, protected loader: AppLoaderService,protected ws: WebSocketService){
  }

  ngOnInit() {
    this.ws.call('user.query').subscribe((user_list)=>{
      this.usr_lst.push(user_list);
    })
    this.ws.call('group.query').subscribe((group_list)=>{
      this.grp_lst.push(group_list);
    })
  }
  afterInit(entityList: any) { this.entityList = entityList; }
  getActions(row) {
    const actions = [];
    actions.push({
      id: row.bsdusr_username,
      icon: 'edit',
      label : helptext.user_list_actions_edit_label,
      name: helptext.user_list_actions_edit_id,
      onClick : (users_edit) => {
        this.router.navigate(new Array('/').concat(
          [ "account", "users", "edit", users_edit.id ]));
      }
    });
    if (row.bsdusr_builtin !== true){

      actions.push({
        id: row.bsdusr_username,
        icon: 'delete',
        name: 'delete',
        label : helptext.user_list_actions_delete_label,
        onClick : (users_edit) => {
          this.entityList.doDelete(users_edit);
        },
      });

    }
    return actions;
  }
  checkbox_confirm(id: any, deleteMsg: any){
    const params = [id, {"delete_group": true}]
    const ds = this.dialogService.confirm(
      helptext.user_list_dialog_label, 
      deleteMsg,
      false, helptext.user_list_dialog_label,
      true,
      helptext.user_list_dialog_message,
      'user.delete',
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
    let user: any
    let group_users: any
    user = _.find(this.usr_lst[0], {id});
    group_users =_.find(this.grp_lst[0], {id: user.group.id})['users'];
    if(group_users.length === 1){
      return true
    };
    return false
  }

  resourceTransformIncomingRestData(d) {
    let data = Object.assign([], d);
    
    this.ws.call('group.query').subscribe((res)=>{
      data.forEach(user => {
        const group = _.find(res, {"gid" : user.group.bsdgrp_gid});
        //user.group.bsdgrp_gid = group['gid'];
        user.gid = group['gid'];
      });
      let rows = data;
      for (let i=0; i<rows.length; i++) {
        rows[i].details = []
        rows[i].details.push({label:T("GID"), value:rows[i].group['bsdgrp_gid']},
                             {label:T("Home Directory"), value:rows[i].home},
                             {label:T("Shell"), value:rows[i].shell},
                             {label:T("Email"), value:rows[i].email});
      };
      
    })
    return data;
  }
}
