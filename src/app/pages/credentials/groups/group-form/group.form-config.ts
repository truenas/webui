// cspell:ignore nopasswd
import { AsyncValidatorFn, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnSelectOption } from '@truenas/ui-components';
import { Observable, combineLatest, of } from 'rxjs';
import {
  map, shareReplay, switchMap, take, tap,
} from 'rxjs/operators';
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
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';

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
 * Self-contained declarative config for the group form — no up-front fetch, no wrapper
 * component. The form renders immediately; the few values that depend on an API call load
 * on the fly into their own fields rather than blocking the whole panel:
 *
 * - **privileges options** — a live `privilege.query` observable bound to the chips field
 *   (shared via `shareReplay`, so the same result feeds `loadData` and `submit` — one call).
 * - **name uniqueness** — an async validator that checks a cached `group.query`, instead of
 *   pre-fetching a forbidden-names list.
 * - **initial values** — `loadData` patches the next GID (add) or the current privilege
 *   selection (edit) once their query resolves; everything else is sync from `editingGroup`.
 *
 * `loadData` makes the renderer treat the form as an edit, so submit branches on
 * `editingGroup` (the closure) rather than `event.isEdit`.
 */
export function getGroupFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
  editingGroup: Group | undefined,
): FormDefinition<GroupFormValue> {
  // One privilege.query, shared by the chips options, loadData (current selection) and submit.
  const privileges$ = api.call('privilege.query').pipe(
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  const privilegeOptions$ = privileges$.pipe(
    map((privileges): TnSelectOption[] => privileges.map((privilege) => ({
      label: privilege.name,
      value: privilege.id,
    }))),
  );
  // Cached existing group names for the async uniqueness check (fetched once on first edit).
  const existingNames$ = api.call('group.query').pipe(
    map((groups) => groups.map((group) => group.group)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  const allSudo = !!editingGroup?.sudo_commands?.includes(allCommands);
  const allSudoNoPass = !!editingGroup?.sudo_commands_nopasswd?.includes(allCommands);

  return {
    addTitle: T('Add Group'),
    editTitle: T('Edit Group'),
    requiredRoles: [Role.AccountWrite],
    // Patch only the value that needs a fetch — the form is already on screen and interactive.
    loadData: () => (editingGroup
      ? privileges$.pipe(take(1), map((privileges) => ({ privileges: selectedPrivilegeIds(privileges, editingGroup) })))
      : api.call('group.get_next_gid').pipe(map((gid) => ({ gid })))),
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
          value: editingGroup?.gid,
          validators: [Validators.pattern(/^\d+$/)],
        },
        {
          name: 'name',
          type: 'input',
          label: T('Name'),
          tooltip: helptextGroups.nameTooltip,
          required: true,
          value: editingGroup?.group ?? '',
          validators: [Validators.pattern(UserService.namePattern)],
          asyncValidators: [groupNameInUseValidator(existingNames$, editingGroup?.group)],
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
          value: allSudo ? [] : (editingGroup?.sudo_commands ?? []),
          enabledWhen: (value) => !value.sudo_commands_all,
        },
        {
          name: 'sudo_commands_all',
          type: 'checkbox',
          label: T('Allow All Sudo Commands'),
          value: allSudo,
        },
        {
          name: 'sudo_commands_nopasswd',
          type: 'chips',
          label: T('Allowed Sudo Commands with No Password'),
          value: allSudoNoPass ? [] : (editingGroup?.sudo_commands_nopasswd ?? []),
          enabledWhen: (value) => !value.sudo_commands_nopasswd_all,
        },
        {
          name: 'sudo_commands_nopasswd_all',
          type: 'checkbox',
          label: T('Allow All Sudo Commands with No Password'),
          value: allSudoNoPass,
        },
        {
          name: 'smb',
          type: 'checkbox',
          label: T('SMB Group'),
          tooltip: helptextGroups.smbTooltip,
          value: editingGroup?.smb ?? false,
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
        // Re-uses the shared (cached) privilege list to diff assignments and derive roles.
        switchMap((group) => privileges$.pipe(
          take(1),
          switchMap((privileges) => {
            const initialPrivilegeIds = editingGroup ? selectedPrivilegeIds(privileges, editingGroup) : [];
            const roles = privileges
              .filter((privilege) => values.privileges.some((id) => id === privilege.id))
              .map((privilege) => privilege.builtin_name) as Role[];
            return togglePrivilegesForGroup(api, privileges, initialPrivilegeIds, group.gid, values.privileges).pipe(
              tap(() => {
                const updated = { ...group, roles };
                store$.dispatch(editingGroup ? groupChanged({ group: updated }) : groupAdded({ group: updated }));
              }),
              map(() => group),
            );
          }),
        )),
      );

      return {
        request$,
        successMessage: editingGroup
          ? translate.instant('Group updated')
          : translate.instant('Group added'),
      };
    },
  };
}

/** Privilege ids currently assigned to the group (those whose local_groups include its GID). */
function selectedPrivilegeIds(privileges: Privilege[], group: Group): number[] {
  return privileges
    .filter((privilege) => privilege.local_groups.some((local) => local.gid === group.gid))
    .map((privilege) => privilege.id);
}

/** Async name-uniqueness check against the cached group list (excludes the edited group's own name). */
function groupNameInUseValidator(
  existingNames$: Observable<string[]>,
  currentName: string | undefined,
): AsyncValidatorFn {
  return (control) => existingNames$.pipe(
    take(1),
    map((names) => forbiddenValues(names.filter((name) => name !== currentName))(control)),
  );
}

/** Adds the group to newly-selected privileges and removes it from de-selected ones. */
function togglePrivilegesForGroup(
  api: ApiService,
  privileges: Privilege[],
  initialPrivilegeIds: number[],
  groupId: number,
  selectedIds: (string | number)[],
): Observable<Privilege[]> {
  const requests$: Observable<Privilege>[] = [];

  const added = privileges.filter((privilege) => selectedIds.some((id) => id === privilege.id));
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
    initialPrivilegeIds.filter((id) => !selectedIds.includes(id)),
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
