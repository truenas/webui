import { Component, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
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
import { MatCheckboxChange } from '@angular/material/checkbox';
import { User } from 'app/interfaces/user';

@Component({
  selector: 'app-group-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class GroupListComponent implements OnDestroy {
  title = 'Groups';
  protected queryCall: 'group.query' = 'group.query';
  protected wsDelete: 'group.delete' = 'group.delete';
  protected route_add: string[] = ['account', 'groups', 'add'];
  protected route_add_tooltip = T('Add Group');
  protected route_edit: string[] = ['account', 'groups', 'edit'];
  protected entityList: any;
  refreshTableSubscription: any;
  protected loaderOpen = false;
  protected globalConfig = {
    id: 'config',
    tooltip: helptext.globalConfigTooltip,
    onClick: () => {
      this.toggleBuiltins();
    },
  };
  protected addComponent: GroupFormComponent;

  columns: any[] = [
    { name: 'Group', prop: 'group', always_display: true },
    { name: 'GID', prop: 'gid' },
    { name: 'Builtin', prop: 'builtin' },
    { name: 'Permit Sudo', prop: 'sudo' },
    { name: 'Samba Authentication', prop: 'smb', hidden: true },
  ];
  rowIdentifier = 'group';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Group'),
      key_props: ['group'],
    },
  };

  constructor(private _router: Router, protected dialogService: DialogService,
    protected loader: AppLoaderService, protected ws: WebSocketService,
    protected prefService: PreferencesService, private translate: TranslateService,
    protected aroute: ActivatedRoute, private modalService: ModalService) {}

  ngOnInit() {
    this.refreshGroupForm();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshGroupForm();
    });
  }

  ngOnDestroy() {
    if (this.refreshTableSubscription) {
      this.refreshTableSubscription.unsubscribe();
    }
  }

  refreshGroupForm() {
    this.addComponent = new GroupFormComponent(this._router, this.ws, this.modalService);
  }

  resourceTransformIncomingRestData(data: any[]) {
    // Default setting is to hide builtin groups
    if (this.prefService.preferences.hide_builtin_groups) {
      const newData: any[] = [];
      data.forEach((item) => {
        if (!item.builtin) {
          newData.push(item);
        }
      });
      return data = newData;
    }
    return data;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
    setTimeout(() => {
      if (this.prefService.preferences.showGroupListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000);

    this.refreshTableSubscription = this.modalService.refreshTable$.subscribe(() => {
      this.entityList.getData();
    });
  }
  isActionVisible(actionId: string, row: any) {
    if (actionId === 'delete' && row.builtin === true) {
      return false;
    }
    return true;
  }

  getActions(row: any) {
    const actions = [];
    actions.push({
      id: row.group,
      name: helptext.group_list_actions_id_member,
      label: helptext.group_list_actions_label_member,
      icon: 'people',
      onClick: (members: any) => {
        this._router.navigate(new Array('/').concat(
          ['credentials', 'groups', 'members', members.id],
        ));
      },
    });
    if (row.builtin === !true) {
      actions.push({
        id: row.group,
        icon: 'edit',
        label: helptext.group_list_actions_label_edit,
        name: helptext.group_list_actions_id_edit,
        onClick: (members_edit: any) => {
          this.modalService.open('slide-in-form', this.addComponent, members_edit.id);
        },
      });
      actions.push({
        id: row.group,
        icon: 'delete',
        name: 'delete',
        label: helptext.group_list_actions_label_delete,
        onClick: (members_delete: any) => {
          const self = this;
          this.loader.open();
          self.ws.call('user.query', [[['group.id', '=', members_delete.id]]]).subscribe(
            (usersInGroup) => {
              this.loader.close();

              const conf: DialogFormConfiguration = {
                title: helptext.deleteDialog.title,
                message: helptext.deleteDialog.message + `<i>${members_delete.group}</i>?`,
                fieldConfig: [],
                confirmCheckbox: true,
                saveButtonText: helptext.deleteDialog.saveButtonText,
                preInit() {
                  if (!usersInGroup.length) {
                    return;
                  }
                  conf.fieldConfig.push({
                    type: 'checkbox',
                    name: 'delete_users',
                    placeholder: T(`Delete ${usersInGroup.length} user(s) with this primary group?`),
                    value: false,
                    onChange: (valueChangeData: { event: MatCheckboxChange }) => {
                      if (valueChangeData.event.checked) {
                        self.dialogService.Info('Following users will be deleted', usersInGroup.map((user, index) => {
                          if (user.full_name && user.full_name.length) {
                            return (index + 1) + '. ' + user.username + ' (' + user.full_name + ')';
                          }
                          return (index + 1) + '. ' + user.username;
                        }).join('\n'));
                      }
                    },
                  });
                },
                customSubmit(entityDialog: EntityDialogComponent) {
                  entityDialog.dialogRef.close(true);
                  self.loader.open();
                  self.ws.call(self.wsDelete, [members_delete.id, entityDialog.formValue]).subscribe(() => {
                    self.entityList.getData();
                    self.loader.close();
                  },
                  (err) => {
                    new EntityUtils().handleWSError(self, err, self.dialogService);
                    self.loader.close();
                  });
                },
              };
              this.dialogService.dialogForm(conf);
            }, (err) => {
              this.loader.close();
              new EntityUtils().handleWSError(self, err, self.dialogService);
            },
          );
        },
      });
    }

    return actions;
  }

  ableToDeleteAllMembers(group: any) {
    return group.users.length !== 0;
  }

  toggleBuiltins() {
    let show;
    this.prefService.preferences.hide_builtin_groups ? show = helptext.builtins_dialog.show
      : show = helptext.builtins_dialog.hide;
    this.translate.get(show).subscribe((action: string) => {
      this.translate.get(helptext.builtins_dialog.title).subscribe((title: string) => {
        this.translate.get(helptext.builtins_dialog.message).subscribe((message: string) => {
          this.dialogService.confirm(action + title,
            action + message, true, action)
            .subscribe((res: boolean) => {
              if (res) {
                this.prefService.preferences.hide_builtin_groups = !this.prefService.preferences.hide_builtin_groups;
                this.prefService.savePreferences();
                this.entityList.needTableResize = false;
                this.entityList.getData();
              }
            });
        });
      });
    });
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
