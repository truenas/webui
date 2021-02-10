import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../../translate-marker';
import { DialogService, StorageService, ValidationService, UserService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../../services/modal.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';
import helptext from '../../../../helptext/account/user-list';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { UserFormComponent } from '../user-form/user-form.component';

@Component({
  selector: 'app-user-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
  providers: [UserService]
})
export class UserListComponent {

  public title = "Users";
  protected route_add: string[] = ['account', 'users', 'add'];
  protected route_add_tooltip = "Add User";
  protected route_edit: string[] = ['account', 'users', 'edit'];

  protected entityList: any;
  protected loaderOpen = false;
  protected usr_lst = [];
  protected grp_lst = [];
  protected hasDetails = true;
  protected queryCall = 'user.query';
  protected wsDelete = 'user.delete';
  // protected queryCallOption = [['OR', [['uid', '=', 0], ['builtin', '=', false]]]];
  protected queryCallOption = [];
  protected globalConfig = {
    id: "config",
    tooltip: helptext.globalConfigTooltip,
    onClick: () => {
      this.toggleBuiltins();
    }
  };

  protected addComponent: UserFormComponent;
  private refreshTableSubscription: any;

  public columns: Array < any > = [
    { name: 'Username', prop: 'username', always_display: true, minWidth: 150},
    { name: 'UID', prop: 'uid', hidden: false, maxWidth: 100 },
    { name: 'GID', prop: 'gid', hidden: true, maxWidth: 100 },
    { name: 'Home directory', prop: 'home', hidden: true  },
    { name: 'Shell', prop: 'shell', hidden: true, minWidth: 150  },
    { name: 'Builtin', prop: 'builtin', hidden: false  },
    { name: 'Full Name', prop: 'full_name', hidden: false, minWidth: 250 },
    { name: 'Email', prop: 'email', hidden: true, maxWidth: 250 },
    { name: 'Password Disabled', prop: 'password_disabled', hidden: true, minWidth: 200 },
    { name: 'Lock User', prop: 'locked', hidden: true },
    { name: 'Permit Sudo', prop: 'sudo', hidden: true  },
    { name: 'Microsoft Account', prop: 'microsoft_account', hidden: true, minWidth: 170 },
    { name : 'Samba Authentication', prop: 'smb', hidden: true }
  ];
  public rowIdentifier = 'username';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'User',
      key_props: ['username']
    }
  };

  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.builtin === true) {
      return false;
    }
    return true;
  }

  constructor(private router: Router,
              protected dialogService: DialogService, protected loader: AppLoaderService,
              protected ws: WebSocketService, protected prefService: PreferencesService,
              private translate: TranslateService, private modalService: ModalService,
              private storageService: StorageService, private userService: UserService,
              private validationService: ValidationService) {
  }

  ngOnInit() {
    this.refreshUserForm();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshUserForm();
    })
  }
  
  refreshUserForm() {
    this.addComponent = new UserFormComponent(this.router,this.ws, this.storageService,this.loader,
      this.userService,this.validationService,this.modalService);
  }

  afterInit(entityList: any) { 
    this.entityList = entityList; 
    setTimeout(() => {
      if(this.prefService.preferences.showUserListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000)

    this.refreshTableSubscription = this.modalService.refreshTable$.subscribe(() => {
      this.entityList.getData();
    })
  }
  getActions(row) {
    const actions = [];
    actions.push({
      id: row.username,
      icon: 'edit',
      label : helptext.user_list_actions_edit_label,
      name: helptext.user_list_actions_edit_id,
      onClick : (users_edit) => {
        this.modalService.open('slide-in-form', this.addComponent, users_edit.id)
      }
    });
    if (row.builtin !== true){

      actions.push({
        id: row.username,
        icon: 'delete',
        name: 'delete',
        label : helptext.user_list_actions_delete_label,
        onClick: (users_edit) => {
          const self = this;
          const conf: DialogFormConfiguration = {
            title: helptext.deleteDialog.title,
            message: helptext.deleteDialog.message + `<i>${users_edit.username}</i>?`,
            fieldConfig: [],
            confirmCheckbox: true,
            saveButtonText: helptext.deleteDialog.saveButtonText,
            preInit: function () {
              if (self.ableToDeleteGroup(users_edit.id)) {
                conf.fieldConfig.push({
                  type: 'checkbox',
                  name: 'delete_group',
                  placeholder: helptext.deleteDialog.deleteGroup_placeholder + users_edit.group.bsdgrp_group,
                  value: false,
                });
              }
            },
            customSubmit: function (entityDialog) {
              entityDialog.dialogRef.close(true);
              self.loader.open();
              self.ws.call(self.wsDelete, [users_edit.id, entityDialog.formValue]).subscribe((res) => {
                self.entityList.getData();
                self.loader.close();
              },
                (err) => {
                  new EntityUtils().handleWSError(self, err, self.dialogService);
                  self.loader.close();
                })
            }
          }
          this.dialogService.dialogForm(conf);
        },
      });
    }
    return actions;
  }

  ableToDeleteGroup(id: any){
    let user: any
    let group_users: any
    user = _.find(this.usr_lst[0], {id});
    group_users =_.find(this.grp_lst[0], {id: user.group.id})['users'];
    // Show checkbox if deleting the last member of a group
    if(group_users.length === 1){
      return true
    };
    return false
  }

  resourceTransformIncomingRestData(d) {
    let data = Object.assign([], d);
    this.usr_lst = [];
    this.grp_lst = [];
    this.usr_lst.push(data);
    this.ws.call('group.query').subscribe((res)=>{
      this.grp_lst.push(res);
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
      
    });
   if (this.prefService.preferences.hide_builtin_users) {
      let newData = []
      data.forEach((item) => {
        if (!item.builtin || item.username === 'root') {
          newData.push(item);
        }
      }) 
      return data = newData;
    }
    return data;
  }

  toggleBuiltins() {
    let show;
    this.prefService.preferences.hide_builtin_users ? show = helptext.builtins_dialog.show :
      show = helptext.builtins_dialog.hide;
      this.translate.get(show).subscribe((action: string) => {
        this.translate.get(helptext.builtins_dialog.title).subscribe((title: string) => {
          this.translate.get(helptext.builtins_dialog.message).subscribe((message: string) => {
          this.dialogService.confirm(action + title, 
            action + message, true, action)
            .subscribe((res) => {
            if (res) {
              this.prefService.preferences.hide_builtin_users = !this.prefService.preferences.hide_builtin_users;
              this.prefService.savePreferences();
              this.entityList.needTableResize = false;
              this.entityList.getData();
            }
          })
        })
      })
    })
  }

  showOneTimeBuiltinMsg() {
    this.prefService.preferences.showUserListMessage = false;
    this.prefService.savePreferences();
    this.dialogService.confirm(helptext.builtinMessageDialog.title, helptext.builtinMessageDialog.message, 
      true, helptext.builtinMessageDialog.button, false, '', '', '', '', true);
  }

  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }
}