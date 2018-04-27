import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import { T } from '../../../../translate-marker';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-user-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class UserListComponent implements OnInit {

  public title = "Users";
  protected resource_name = 'account/users';
  protected route_add: string[] = ['account', 'users', 'add'];
  protected route_add_tooltip = "Add User";
  protected route_edit: string[] = ['account', 'users', 'edit'];
  protected route_delete: string[] = ['account', 'users', 'delete'];
  protected entityList: any;
  protected loaderOpen = false;
  protected usr_lst = []
  protected grp_lst = [] 

  public columns: Array < any > = [
    { name: 'Username', prop: 'bsdusr_username' },
    { name: 'UID', prop: 'bsdusr_uid' },
    { name: 'GID', prop: 'bsdusr_group' },
    { name: 'Home directory', prop: 'bsdusr_home' },
    { name: 'Shell', prop: 'bsdusr_shell' },
    { name: 'Builtin', prop: 'bsdusr_builtin' },
    { name: 'Full Name', prop: 'bsdusr_full_name' },
    { name: 'Email', prop: 'bsdusr_email' },
    { name: 'Disable Password Login', prop: 'bsdusr_password_disabled' },
    { name: 'Lock User', prop: 'bsdusr_locked' },
    { name: 'Permit Sudo', prop: 'bsdusr_sudo' },
    { name: 'Microsoft Account', prop: 'bsdusr_microsoft_account' },
  ];
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.bsdusr_builtin === true) {
      return false;
    }
    return true;
  }

  getUserList() {
    this.rest.get(this.resource_name, {}).subscribe((res) => {})
  }

  constructor(protected rest: RestService, private router: Router, private tour: TourService,
              protected dialogService: DialogService, protected loader: AppLoaderService,protected ws: WebSocketService){
    this.getUserList()
  }

  ngOnInit() {
    const showTour = localStorage.getItem(this.router.url) || 'false';
    if (showTour !== "true") {
      hopscotch.startTour(this.tour.startTour(this.router.url));
      localStorage.setItem(this.router.url, 'true');
    }
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
      label : T("Edit"),
      id: "edit",
      onClick : (users_edit) => {
        this.router.navigate(new Array('/').concat(
          [ "account", "users", "edit", users_edit.id ]));
      }
    });
    if (row.bsdusr_builtin !== true){

      actions.push({
        label : T("Delete"),
        onClick : (users_edit) => {
          this.entityList.doDelete(users_edit.id );
        },
      });

    }
    return actions;
  }
  checkbox_confirm(id: any){
    const params = [id, {"delete_group": true}]
    const ds = this.dialogService.confirm(
      T("Delete"), 
      T("Are you sure you want to delete the selected item?"), 
      false, T("Delete"),
      true,
      T('Do not delete user primary group'),
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
    group_users =_.find(this.grp_lst[0], {id: user.group.id}).users;
    if(group_users.length === 1){
      return true
    };
    return false


  }
}
