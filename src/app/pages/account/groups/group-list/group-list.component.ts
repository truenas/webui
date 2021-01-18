import {Component} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from 'app/services';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../../services/ws.service';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import helptext from '../../../../helptext/account/group-list';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../../services/modal.service';
import { T } from '../../../../translate-marker';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { GroupFormComponent } from '../group-form/group-form.component';

@Component({
  selector : 'app-group-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class GroupListComponent {
  public title = "Groups";
  protected queryCall = 'group.query';
  protected wsDelete = 'group.delete';
  protected route_add: string[] = ['account', 'groups', 'add' ];
  protected route_add_tooltip = T("Add Group");
  protected route_edit: string[] = [ 'account', 'groups', 'edit' ];
  protected entityList: any;
  refreshTableSubscription: any;
  protected loaderOpen = false;
  protected globalConfig = {
    id: "config",
    tooltip: helptext.globalConfigTooltip,
    onClick: () => {
      this.toggleBuiltins();
    }
  };
  protected addComponent: GroupFormComponent;
  
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

  constructor(private _router: Router, protected dialogService: DialogService, 
    protected loader: AppLoaderService,protected ws: WebSocketService,
    protected prefService: PreferencesService, private translate: TranslateService,
    protected aroute: ActivatedRoute, private modalService: ModalService){}

  ngOnInit() {
    this.refreshGroupForm();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshGroupForm();
    })
  }
  
  refreshGroupForm() {
    this.addComponent = new GroupFormComponent(this._router,this.ws,this.modalService);
  }

  resourceTransformIncomingRestData(data) {
    // Default setting is to hide builtin groups 
    if (this.prefService.preferences.hide_builtin_groups) {
      let newData = []
      data.forEach((item) => {
        if (!item.builtin) {
          newData.push(item);
        }
      }) 
      return data = newData;
    }
    return data;
  }

  afterInit(entityList: any) { 
    this.entityList = entityList; 
    setTimeout(() => {
      if(this.prefService.preferences.showGroupListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000)

    this.refreshTableSubscription = this.modalService.refreshTable$.subscribe(() => {
      this.entityList.getData();
    })

  }
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
          [ "credentials", "groups", "members", members.id ]));
      }
    });
    if (row.builtin === !true){
      actions.push({
        id: row.group,
        icon: 'edit',
        label : helptext.group_list_actions_label_edit,
        name: helptext.group_list_actions_id_edit,
        onClick : (members_edit) => {
          this.modalService.open('slide-in-form', this.addComponent, members_edit.id)
        }
      })
      actions.push({
        id: row.group,
        icon: 'delete',
        name: 'delete',
        label : helptext.group_list_actions_label_delete,
        onClick : (members_delete) => {
          const self = this;
          const conf: DialogFormConfiguration = {
            title: helptext.deleteDialog.title,
            message: helptext.deleteDialog.message + `<i>${members_delete.group}</i>?`,
            fieldConfig: [],
            confirmCheckbox: true,
            saveButtonText: helptext.deleteDialog.saveButtonText,
            preInit: function () {
              if (self.ableToDeleteAllMembers(members_delete)) {
                conf.fieldConfig.push({
                  type: 'checkbox',
                  name: 'delete_users',
                  placeholder: T(`Delete all ${members_delete.users.length} users with this primary group?`),
                  value: false,
                });
              }
            },
            customSubmit: function (entityDialog) {
              entityDialog.dialogRef.close(true);
              self.loader.open();
              self.ws.call(self.wsDelete, [members_delete.id, entityDialog.formValue]).subscribe((res) => {
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

  ableToDeleteAllMembers(group){
    return group.users.length !== 0;
  }

  toggleBuiltins() {
    let show;
    this.prefService.preferences.hide_builtin_groups ? show = helptext.builtins_dialog.show :
      show = helptext.builtins_dialog.hide;
      this.translate.get(show).subscribe((action: string) => {
        this.translate.get(helptext.builtins_dialog.title).subscribe((title: string) => {
          this.translate.get(helptext.builtins_dialog.message).subscribe((message: string) => {
          this.dialogService.confirm(action + title, 
            action + message, true, action)
            .subscribe((res) => {
            if (res) {
                this.prefService.preferences.hide_builtin_groups = !this.prefService.preferences.hide_builtin_groups;
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
    this.prefService.preferences.showGroupListMessage = false;
    this.prefService.savePreferences();
    this.dialogService.confirm(helptext.builtinMessageDialog.title, helptext.builtinMessageDialog.message, 
      true, helptext.builtinMessageDialog.button, false, '', '', '', '', true);
  }

  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }       
  
}
