import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { Role } from 'app/enums/role.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { Group } from 'app/interfaces/group.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  buildGroupForm, getGroupFormConfig, GroupFormConfigDeps, GroupFormValue,
} from 'app/pages/credentials/groups/group-form/group.form-config';
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
        case 'group.query': return of([{ group: 'existing', gid: 1111 }] as Group[]);
        case 'group.get_next_gid': return of(1234);
        default: return of(undefined);
      }
    }),
  } as unknown as ApiService);

  describe('buildGroupForm', () => {
    it('prefills the next GID and leaves editData empty when adding', async () => {
      const { definition, editData } = await firstValueFrom(buildGroupForm(makeApi(), translate, store$, undefined));

      expect(editData).toBeUndefined();
      const gidField = definition.sections?.[0].fields.find((field) => field.name === 'gid');
      expect(gidField?.value).toBe(1234);
    });

    it('derives editData + currently-selected privileges when editing (no GID fetch)', async () => {
      const api = makeApi();
      const { editData } = await firstValueFrom(buildGroupForm(api, translate, store$, fakeGroup));

      expect(editData).toMatchObject({
        name: 'editing',
        smb: false,
        sudo_commands_nopasswd: [],
        sudo_commands_nopasswd_all: true,
        privileges: [1],
      });
      expect(api.call).not.toHaveBeenCalledWith('group.get_next_gid');
    });
  });

  describe('submit', () => {
    const deps = (editingGroup: Group | undefined): GroupFormConfigDeps => ({
      api: makeApi(),
      translate,
      store$,
      editingGroup,
      privilegeOptions$: of([]),
      privileges: fakePrivileges,
      initialPrivilegeIds: editingGroup ? [1] : [],
      forbiddenNames: [],
      gidDefault: 1234,
    });

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

    it('builds a create payload with the sudo `all` sentinel applied', () => {
      const config = deps(undefined);
      const definition = getGroupFormConfig(config);
      definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<GroupFormValue>)
        .request$.subscribe();

      expect(config.api.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
    });

    it('builds an update payload scoped to the edited group id', () => {
      const config = deps(fakeGroup);
      const definition = getGroupFormConfig(config);
      definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<GroupFormValue>)
        .request$.subscribe();

      expect(config.api.call).toHaveBeenCalledWith('group.update', [13, {
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
    });
  });
});
