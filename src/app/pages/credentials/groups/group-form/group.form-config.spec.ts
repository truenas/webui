import { AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { Group } from 'app/interfaces/group.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormFieldDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { getGroupFormConfig, GroupFormValue } from 'app/pages/credentials/groups/group-form/group.form-config';
import { groupAdded, groupChanged } from 'app/pages/credentials/groups/store/group.actions';
import { AppState } from 'app/store';

describe('group form config', () => {
  const fakePrivileges = [
    {
      id: 1,
      name: 'Privilege 1',
      builtin_name: null,
      web_shell: true,
      roles: [Role.SharingAdmin],
      local_groups: [{ gid: 1111 }, { gid: 2222 }],
      ds_groups: [{ gid: 1223 }],
    },
    {
      id: 2,
      name: 'Privilege 2',
      builtin_name: null,
      web_shell: false,
      roles: [Role.FullAdmin],
      local_groups: [],
      ds_groups: [],
    },
  ] as unknown as Privilege[];

  const fakeGroup = {
    id: 13, gid: 1111, group: 'editing', smb: false, sudo_commands: [], sudo_commands_nopasswd: [allCommands],
  } as Group;

  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store<AppState>;

  const makeApi = (): ApiService => ({
    call: jest.fn((method: ApiCallMethod) => {
      switch (method) {
        case 'privilege.query': return of(fakePrivileges);
        case 'group.query': return of([{ group: 'existing', gid: 9999 }] as Group[]);
        case 'group.get_next_gid': return of(1234);
        default: return of(undefined);
      }
    }),
  } as unknown as ApiService);

  const fieldByName = (
    definition: ReturnType<typeof getGroupFormConfig>,
    name: keyof GroupFormValue,
  ): FormFieldDefinition<GroupFormValue> | undefined => definition.sections?.[0].fields
    .find((field) => field.name === name);

  beforeEach(() => jest.clearAllMocks());

  describe('loadData (async values patched on the fly)', () => {
    it('loads the next GID when adding', async () => {
      const api = makeApi();
      const definition = getGroupFormConfig(api, translate, store$, undefined);

      expect(await firstValueFrom(definition.loadData())).toEqual({ gid: 1234 });
    });

    it('loads the current privilege selection when editing — no GID fetch', async () => {
      const api = makeApi();
      const definition = getGroupFormConfig(api, translate, store$, fakeGroup);

      expect(await firstValueFrom(definition.loadData())).toEqual({ privileges: [1] });
      expect(api.call).not.toHaveBeenCalledWith('group.get_next_gid');
    });
  });

  describe('initial field values (sync from the edited group)', () => {
    it('seeds the entity values, mapping the sudo `all` sentinel to its toggle', () => {
      const definition = getGroupFormConfig(makeApi(), translate, store$, fakeGroup);

      expect(fieldByName(definition, 'gid')?.value).toBe(1111);
      expect(fieldByName(definition, 'gid')?.disabled).toBe(true);
      expect(fieldByName(definition, 'name')?.value).toBe('editing');
      expect(fieldByName(definition, 'smb')?.value).toBe(false);
      expect(fieldByName(definition, 'sudo_commands_nopasswd')?.value).toEqual([]);
      expect(fieldByName(definition, 'sudo_commands_nopasswd_all')?.value).toBe(true);
    });

    it('leaves the GID unset (loaded later) and enabled when adding', () => {
      const definition = getGroupFormConfig(makeApi(), translate, store$, undefined);

      expect(fieldByName(definition, 'gid')?.value).toBeUndefined();
      expect(fieldByName(definition, 'gid')?.disabled).toBe(false);
    });
  });

  describe('name uniqueness async validator', () => {
    it('flags a name already in use and accepts a fresh one', async () => {
      const definition = getGroupFormConfig(makeApi(), translate, store$, undefined);
      const validate = fieldByName(definition, 'name')?.asyncValidators?.[0];

      expect(await firstValueFrom(validate({ value: 'existing' } as AbstractControl))).toBeTruthy();
      expect(await firstValueFrom(validate({ value: 'fresh' } as AbstractControl))).toBeNull();
    });
  });

  describe('submit', () => {
    const allValues = {
      gid: 1234,
      name: 'new',
      smb: true,
      sudo_commands: [],
      sudo_commands_all: true,
      sudo_commands_nopasswd: ['ls'],
      sudo_commands_nopasswd_all: false,
      privileges: [1],
    } as GroupFormValue;

    const event = { allValues, changedValues: allValues } as FormSubmitEvent<GroupFormValue>;

    it('builds a create payload with the sudo `all` sentinel applied, then dispatches groupAdded', () => {
      const api = makeApi();
      const definition = getGroupFormConfig(api, translate, store$, undefined);
      definition.submit({ ...event, isEdit: false }).request$.subscribe();

      expect(api.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
      expect(store$.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: groupAdded.type }));
    });

    it('builds an update payload scoped to the edited group id, then dispatches groupChanged', () => {
      const api = makeApi();
      const definition = getGroupFormConfig(api, translate, store$, fakeGroup);
      definition.submit({ ...event, isEdit: true }).request$.subscribe();

      expect(api.call).toHaveBeenCalledWith('group.update', [13, {
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
      expect(store$.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: groupChanged.type }));
    });
  });
});
