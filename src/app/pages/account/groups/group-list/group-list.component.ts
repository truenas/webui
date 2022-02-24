import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/account/group-list';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { Group, MembershipGroup } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import {
  builtinGroupsToggled,
  oneTimeBuiltinGroupsMessageShown,
} from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'app-group-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class GroupListComponent implements EntityTableConfig<MembershipGroup> {
  users: User[] = [];
  members: User[] = [];
  title = 'Groups';
  queryCall = 'group.query' as const;
  wsDelete = 'group.delete' as const;
  protected entityList: EntityTableComponent;
  protected loaderOpen = false;
  globalConfig = {
    id: 'config',
    tooltip: helptext.globalConfigTooltip,
    onClick: () => {
      this.toggleBuiltins();
    },
  };

  columns = [
    { name: 'Group', prop: 'group', always_display: true },
    { name: 'GID', prop: 'gid' },
    { name: 'Builtin', prop: 'builtin' },
    { name: 'Permit Sudo', prop: 'sudo' },
    { name: 'Membership', prop: 'membership', hidden: false },
    { name: 'Samba Authentication', prop: 'smb', hidden: true },
  ];
  rowIdentifier = 'group';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Group'),
      key_props: ['group'],
    },
  };

  private showGroupListMessage = false;
  private hideBuiltinGroups = true;

  constructor(
    private router: Router,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
  ) {}

  preInit(): void {
    combineLatest([
      this.ws.call('user.query'),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([users, preferences]) => {
      this.users = users;
      this.showGroupListMessage = preferences.showGroupListMessage;
      this.hideBuiltinGroups = preferences.hideBuiltinGroups;
    });
  }

  resourceTransformIncomingRestData(data: Group[]): MembershipGroup[] {
    // Default setting is to hide builtin groups
    if (this.hideBuiltinGroups) {
      const newData: MembershipGroup[] = [];
      data.forEach((item) => {
        if (!item.builtin) {
          this.members = this.users.filter((user) => item.users.includes(user.id));
          newData.push({
            ...item,
            membership: this.members.map((member) => member.username).join(', '),
          });
        }
      });
      return data = newData;
    }
    return data;
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    setTimeout(() => {
      if (this.showGroupListMessage) {
        this.showOneTimeBuiltinMsg();
      }
    }, 2000);

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  isActionVisible(actionId: string, row: Group): boolean {
    if (actionId === 'delete' && row.builtin) {
      return false;
    }
    return true;
  }

  getActions(row: Group): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: row.group,
      name: helptext.group_list_actions_id_member,
      label: helptext.group_list_actions_label_member,
      icon: 'people',
      onClick: (members: Group) => {
        this.router.navigate(['/', 'credentials', 'groups', 'members', String(members.id)]);
      },
    });
    if (row.builtin === !true) {
      actions.push({
        id: row.group,
        icon: 'edit',
        label: helptext.group_list_actions_label_edit,
        name: helptext.group_list_actions_id_edit,
        onClick: (group: Group) => {
          const modal = this.slideInService.open(GroupFormComponent);
          modal.setupForm(group);
        },
      });
      actions.push({
        id: row.group,
        icon: 'delete',
        name: 'delete',
        label: helptext.group_list_actions_label_delete,
        onClick: (group: Group) => {
          const conf: DialogFormConfiguration = {
            title: helptext.deleteDialog.title,
            message: this.translate.instant('Delete group "{name}"?', { name: group.group }),
            fieldConfig: [],
            confirmCheckbox: true,
            saveButtonText: helptext.deleteDialog.saveButtonText,
            preInit: () => {
              if (!this.members.length) {
                return;
              }
              conf.fieldConfig.push({
                type: 'checkbox',
                name: 'delete_users',
                placeholder: this.translate.instant(
                  'Delete {n, plural, one {# user} other {# users}} with this primary group?',
                  { n: this.members.length },
                ),
                value: false,
                onChange: (valueChangeData: { event: MatCheckboxChange }) => {
                  if (valueChangeData.event.checked) {
                    this.dialogService.info('Following users will be deleted', this.members.map((user, index) => {
                      if (user.full_name && user.full_name.length) {
                        return (index + 1) + '. ' + user.username + ' (' + user.full_name + ')';
                      }
                      return (index + 1) + '. ' + user.username;
                    }).join('\n'));
                  }
                },
              });
            },
            customSubmit: (entityDialog: EntityDialogComponent) => {
              entityDialog.dialogRef.close(true);
              this.loader.open();
              this.ws.call(this.wsDelete, [group.id, entityDialog.formValue])
                .pipe(untilDestroyed(this))
                .subscribe(() => {
                  this.entityList.getData();
                  this.loader.close();
                },
                (err) => {
                  new EntityUtils().handleWsError(this, err, this.dialogService);
                  this.loader.close();
                });
            },
          };
          this.dialogService.dialogForm(conf);
        },
      });
    }

    return actions as EntityTableAction[];
  }

  toggleBuiltins(): void {
    let dialogOptions: ConfirmOptions;
    if (this.hideBuiltinGroups) {
      dialogOptions = {
        title: this.translate.instant('Show Built-in Groups'),
        message: this.translate.instant('Show built-in groups (default setting is <i>hidden</i>).'),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Show'),
      };
    } else {
      dialogOptions = {
        title: this.translate.instant('Hide Built-in Groups'),
        message: this.translate.instant('Hide built-in groups (default setting is <i>hidden</i>).'),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Hide'),
      };
    }

    this.dialogService.confirm(dialogOptions).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.store$.dispatch(builtinGroupsToggled());
      this.entityList.getData();
    });
  }

  showOneTimeBuiltinMsg(): void {
    this.store$.dispatch(oneTimeBuiltinGroupsMessageShown());
    this.dialogService.confirm({
      title: helptext.builtinMessageDialog.title,
      message: helptext.builtinMessageDialog.message,
      hideCheckBox: true,
      buttonMsg: helptext.builtinMessageDialog.button,
      hideCancel: true,
    });
  }

  doAdd(): void {
    const modal = this.slideInService.open(GroupFormComponent);
    modal.setupForm();
  }
}
