import { Component } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Subject } from 'rxjs';
import helptext from 'app/helptext/account/group-list';
import { CoreEvent } from 'app/interfaces/events';
import { Group, MembershipGroup } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { ControlConfig, ToolbarConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { GroupFormComponent } from 'app/pages/account/groups/group-form/group-form.component';
import { DialogService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import {
  builtinGroupsToggled,
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
  settingsEvent$: Subject<CoreEvent> = new Subject();

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
  filterString = '';

  private hideBuiltinGroups = true;

  constructor(
    private router: Router,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
    private core: CoreService,
  ) {}

  preInit(): void {
    combineLatest([
      this.ws.call('user.query'),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([users, preferences]) => {
      this.users = users;
      this.hideBuiltinGroups = preferences.hideBuiltinGroups;
      this.setupToolbar();
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
    this.store$.dispatch(builtinGroupsToggled());
    this.entityList.getData();
  }

  doAdd(): void {
    const modal = this.slideInService.open(GroupFormComponent);
    modal.setupForm();
  }

  setupToolbar(): void {
    this.settingsEvent$ = new Subject();
    this.settingsEvent$.pipe(
      untilDestroyed(this),
    ).subscribe((event: CoreEvent) => {
      switch (event.data.event_control) {
        case 'filter':
          this.filterString = event.data.filter;
          this.entityList.filter(this.filterString);
          break;
        case 'add':
          this.doAdd();
          break;
        case 'config':
          this.toggleBuiltins();
          break;
        default:
          break;
      }
    });

    const controls: ControlConfig[] = [
      {
        name: 'filter',
        type: 'input',
        value: this.filterString,
        placeholder: this.translate.instant('Search'),
      },
      {
        name: 'config',
        type: 'button',
        label: this.hideBuiltinGroups
          ? this.translate.instant('Show built-in groups')
          : this.translate.instant('Hide built-in groups'),
      },
      {
        name: 'add',
        type: 'button',
        label: this.translate.instant('Add'),
        color: 'primary',
        ixAutoIdentifier: 'Groups_ADD',
      },
    ];

    const toolbarConfig: ToolbarConfig = {
      target: this.settingsEvent$,
      controls,
    };
    const settingsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: toolbarConfig,
    };

    this.core.emit({ name: 'GlobalActions', data: settingsConfig, sender: this });
  }
}
