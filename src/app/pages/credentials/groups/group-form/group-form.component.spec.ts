// cspell:ignore ngneat nopasswd
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnChipInputHarness, TnFormFieldHarness, TnInputHarness,
} from '@truenas/ui-components';
import { allCommands } from 'app/constants/all-commands.constant';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { Privilege } from 'app/interfaces/privilege.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { GroupFormComponent } from 'app/pages/credentials/groups/group-form/group-form.component';

describe('GroupFormComponent', () => {
  let spectator: Spectator<GroupFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const fakePrivilegeDataSource: Privilege[] = [
    {
      id: 1,
      name: 'Privilege 1',
      web_shell: true,
      local_groups: [{ gid: 1111, group: 'Group A' }, { gid: 2222, group: 'Group B' }],
      ds_groups: [{ gid: 1223 }],
      roles: [Role.SharingAdmin],
    },
    {
      id: 2,
      name: 'Privilege 2',
      web_shell: false,
      local_groups: [],
      ds_groups: [],
      roles: [Role.FullAdmin, Role.ReadonlyAdmin],
    },
  ] as Privilege[];

  const fakeDataGroup = {
    id: 13,
    gid: 1111,
    sudo_commands: [] as string[],
    name: 'Group A',
    sudo_commands_nopasswd: [allCommands],
    smb: false,
    group: 'editing',
  } as Group;

  const slideInRef: SlideInRef<Group | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: GroupFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('group.query', [{ group: 'existing', gid: 1111 }] as Group[]),
        mockCall('privilege.query', fakePrivilegeDataSource),
        mockCall('group.create', 1111),
        mockCall('group.update', 1111),
        mockCall('privilege.update'),
        mockCall('group.get_next_gid', 1234),
      ]),
      mockProvider(SlideInRef, slideInRef),
      ...ixFormTestingProviders(),
      provideMockStore(),
      provideTnFormFieldErrors(),
      mockAuth(),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[data-control-name="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[data-control-name="${name}"]` }),
  );
  const getChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[data-control-name="${name}"]` }),
  );

  describe('adding a group', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('loads names of existing groups and makes sure new name is unique', async () => {
      const nameInput = await getInput('name');
      await nameInput.setValue('existing');

      expect(api.call).toHaveBeenCalledWith('group.query');
      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      expect(await nameField.getErrorMessage()).toBe('The name "existing" is already in use.');
    });

    it('loads next gid and puts it in gid field', async () => {
      const value = await (await getInput('gid')).getValue();

      expect(api.call).toHaveBeenCalledWith('group.get_next_gid');
      expect(value).toBe('1234');
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      await (await getInput('name')).setValue('new');
      await (await getCheckbox('smb')).check();
      await (await getCheckbox('sudo_commands_all')).check();
      await (await getChipInput('sudo_commands_nopasswd')).addChip('ls');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('group.create', [{
        gid: 1234,
        name: 'new',
        smb: true,
        sudo_commands: [allCommands],
        sudo_commands_nopasswd: ['ls'],
      }]);
    });
  });

  describe('editing a group', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => fakeDataGroup }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('does not show Allow Duplicate Gid on edit', async () => {
      const fields = await loader.getAllHarnesses(TnFormFieldHarness.with({ label: 'Allow Duplicate Gid' }));
      expect(fields).toHaveLength(0);
    });

    it('shows current group values when form is being edited', async () => {
      expect(await (await getInput('gid')).getValue()).toBe('1111');
      expect(await (await getInput('name')).getValue()).toBe('editing');
      expect(await (await getCheckbox('sudo_commands_all')).isChecked()).toBe(false);
      expect(await (await getCheckbox('sudo_commands_nopasswd_all')).isChecked()).toBe(true);
      expect(await (await getCheckbox('smb')).isChecked()).toBe(false);

      expect(await (await getChipInput('sudo_commands')).getChips()).toEqual([]);
      expect(await (await getChipInput('sudo_commands_nopasswd')).getChips()).toEqual([]);
      expect(await (await getChipInput('privileges')).getChips()).toEqual(['Privilege 1']);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await (await getInput('name')).setValue('updated');
      await (await getCheckbox('smb')).check();
      await (await getCheckbox('sudo_commands_nopasswd_all')).uncheck();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('group.update', [
        13,
        {
          name: 'updated',
          smb: true,
          sudo_commands: [],
          sudo_commands_nopasswd: [],
        },
      ]);

      // Privilege 1 is kept, so the group's gid is re-saved on it.
      expect(api.call).toHaveBeenCalledWith('privilege.update', [1, {
        ds_groups: [1223], local_groups: [1111, 2222], name: 'Privilege 1', roles: ['SHARING_ADMIN'], web_shell: true,
      }]);
    });

    it('updates privilege items when removed privilege from the group', async () => {
      await (await getInput('name')).setValue('updated');
      await (await getCheckbox('smb')).check();
      await (await getCheckbox('sudo_commands_nopasswd_all')).uncheck();
      await (await getChipInput('privileges')).removeChip('Privilege 1');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('privilege.update', [1, {
        ds_groups: [1223], local_groups: [2222], name: 'Privilege 1', roles: ['SHARING_ADMIN'], web_shell: true,
      }]);
    });
  });

  describe('hosted in a side panel (no SlideInRef)', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { group: fakeDataGroup },
        providers: [{ provide: SlideInRef, useValue: null }],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('reads the group to edit from the input', async () => {
      expect(await (await getInput('name')).getValue()).toBe('editing');
    });

    it('does not render the in-form Save button (the panel host owns it)', async () => {
      const saveButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Save' }));
      expect(saveButton).toBeNull();
    });

    it('emits closed after a successful submit driven by the host', async () => {
      const closedSpy = jest.spyOn(spectator.component.closed, 'emit');
      await (await getInput('name')).setValue('updated');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('group.update', [13, expect.objectContaining({ name: 'updated' })]);
      expect(closedSpy).toHaveBeenCalledWith(true);
    });
  });
});
