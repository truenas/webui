// cspell:ignore nopasswd
import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnSelectOption } from '@truenas/ui-components';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { helptextGroups } from 'app/helptext/account/groups';
import { Group } from 'app/interfaces/group.interface';
import { Privilege, PrivilegeUpdate } from 'app/interfaces/privilege.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { groupAdded, groupChanged } from 'app/pages/credentials/groups/store/group.actions';
import { GroupSlice } from 'app/pages/credentials/groups/store/group.selectors';
import { UserService } from 'app/services/user.service';

/** Shape of the group form built by the renderer (matches the field list below). */
export interface GroupFormValue {
  gid: number | null;
  name: string;
  sudo_commands: string[];
  sudo_commands_all: boolean;
  sudo_commands_nopasswd: string[];
  sudo_commands_nopasswd_all: boolean;
  smb: boolean;
  privileges: (string | number)[];
}

/**
 * Everything the config needs, resolved upfront by the host wrapper. The wrapper
 * does the async setup (privilege.query, group.query, group.get_next_gid) so the
 * declarative definition can stay synchronous: `privileges`/`initialPrivilegeIds`
 * are read at submit time to diff which privileges to (un)assign, `gidDefault`
 * pre-fills the GID in add mode, and `forbiddenNames` powers the uniqueness rule.
 */
export interface GroupFormConfigDeps {
  api: ApiService;
  translate: TranslateService;
  store$: Store<GroupSlice>;
  editingGroup: Group | undefined;
  privilegeOptions$: Observable<TnSelectOption[]>;
  privileges: Privilege[];
  initialPrivilegeIds: number[];
  forbiddenNames: string[];
  gidDefault: number | null;
}

export function getGroupFormConfig(deps: GroupFormConfigDeps): FormDefinition<GroupFormValue> {
  const {
    api, translate, store$, editingGroup, privilegeOptions$, forbiddenNames, gidDefault,
  } = deps;

  return {
    addTitle: T('Add Group'),
    editTitle: T('Edit Group'),
    requiredRoles: [Role.AccountWrite],
    sections: [{
      title: T('Group Configuration'),
      fields: [
        {
          name: 'gid',
          type: 'input',
          inputType: 'number',
          label: ignoreTranslation('GID'),
          tooltip: helptextGroups.groupIdTooltip,
          required: true,
          // GID is fixed once the group exists; editable only when creating.
          disabled: !!editingGroup,
          value: editingGroup ? editingGroup.gid : (gidDefault ?? undefined),
          validators: [Validators.pattern(/^\d+$/)],
        },
        {
          name: 'name',
          type: 'input',
          label: T('Name'),
          tooltip: helptextGroups.nameTooltip,
          required: true,
          validators: [Validators.pattern(UserService.namePattern), forbiddenValues(forbiddenNames)],
        },
        {
          name: 'privileges',
          type: 'chips',
          label: T('Privileges'),
          tooltip: helptextGroups.privilegesTooltip,
          options: privilegeOptions$,
          allowCustomValue: false,
        },
        {
          name: 'sudo_commands',
          type: 'chips',
          label: T('Allowed Sudo Commands'),
          enabledWhen: (value) => !value.sudo_commands_all,
        },
        {
          name: 'sudo_commands_all',
          type: 'checkbox',
          label: T('Allow All Sudo Commands'),
        },
        {
          name: 'sudo_commands_nopasswd',
          type: 'chips',
          label: T('Allowed Sudo Commands with No Password'),
          enabledWhen: (value) => !value.sudo_commands_nopasswd_all,
        },
        {
          name: 'sudo_commands_nopasswd_all',
          type: 'checkbox',
          label: T('Allow All Sudo Commands with No Password'),
        },
        {
          name: 'smb',
          type: 'checkbox',
          label: T('SMB Group'),
          tooltip: helptextGroups.smbTooltip,
        },
      ],
    }],
    submit: (event) => {
      // Full raw value (not changedValues): sudo_commands(_nopasswd) are derived
      // from their `_all` toggles, so a per-field diff would drop the pairing.
      const values = event.allValues;
      const commonBody = {
        name: values.name,
        smb: values.smb,
        sudo_commands: values.sudo_commands_all ? [allCommands] : values.sudo_commands,
        sudo_commands_nopasswd: values.sudo_commands_nopasswd_all ? [allCommands] : values.sudo_commands_nopasswd,
      };

      const request$ = (editingGroup
        ? api.call('group.update', [editingGroup.id, commonBody])
        : api.call('group.create', [{ ...commonBody, gid: values.gid as number }])
      ).pipe(
        switchMap((id) => api.call('group.query', [[['id', '=', id]]])),
        map((groups) => groups[0]),
        switchMap((group) => togglePrivilegesForGroup(deps, group.gid, values.privileges).pipe(map(() => group))),
      );

      return {
        request$,
        successMessage: event.isEdit
          ? translate.instant('Group updated')
          : translate.instant('Group added'),
        onSuccess: (result: unknown) => {
          const group = result as Group;
          const roles = deps.privileges
            .filter((privilege) => values.privileges.some((id) => id === privilege.id))
            .map((privilege) => privilege.builtin_name) as Role[];

          if (event.isEdit) {
            store$.dispatch(groupChanged({ group: { ...group, roles } }));
          } else {
            store$.dispatch(groupAdded({ group: { ...group, roles } }));
          }
        },
      };
    },
  };
}

/** Adds the group to newly-selected privileges and removes it from de-selected ones. */
function togglePrivilegesForGroup(
  deps: GroupFormConfigDeps,
  groupId: number,
  selectedPrivilegeIds: (string | number)[],
): Observable<Privilege[]> {
  const { api, privileges, initialPrivilegeIds } = deps;
  const requests$: Observable<Privilege>[] = [];

  const added = privileges.filter((privilege) => selectedPrivilegeIds.some((id) => id === privilege.id));
  added.forEach((privilege) => {
    requests$.push(
      api.call('privilege.update', [
        privilege.id,
        mapPrivilegeToPrivilegeUpdate(
          privilege,
          Array.from(new Set([...privilege.local_groups.map((group) => group.gid), groupId])),
        ),
      ]),
    );
  });

  const removedIds = Array.from(new Set(
    initialPrivilegeIds.filter((id) => !selectedPrivilegeIds.includes(id)),
  ));
  const removed = privileges.filter((privilege) => removedIds.some((id) => id === privilege.id));
  removed.forEach((privilege) => {
    requests$.push(
      api.call('privilege.update', [
        privilege.id,
        mapPrivilegeToPrivilegeUpdate(
          privilege,
          privilege.local_groups.map((group) => group.gid).filter((gid) => gid !== groupId),
        ),
      ]),
    );
  });

  return requests$.length ? combineLatest(requests$) : of([]);
}

function mapPrivilegeToPrivilegeUpdate(privilege: Privilege, localGroups: number[]): PrivilegeUpdate {
  return {
    local_groups: localGroups,
    ds_groups: privilege.ds_groups.map((group) => group.gid),
    name: privilege.name,
    roles: privilege.roles,
    web_shell: privilege.web_shell,
  };
}
