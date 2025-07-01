import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DetailsItemHarness } from 'app/modules/details-table/details-item/details-item.harness';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxPermissionsHarness } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/new-users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AdditionalDetailsSectionComponent', () => {
  let spectator: Spectator<AdditionalDetailsSectionComponent>;
  let loader: HarnessLoader;

  const shellAccess = signal(false);
  const mockUser = {
    id: 69,
    uid: 1004,
    username: 'test',
    home: '/home/test',
    shell: '/usr/bin/bash',
    full_name: 'test',
    builtin: false,
    smb: true,
    ssh_password_enabled: true,
    password_disabled: false,
    locked: false,
    sudo_commands_nopasswd: ['rm -rf /'],
    sudo_commands: [allCommands],
    email: null,
    sshpubkey: null,
    group: {
      id: 101,
    },
    groups: [102, 103],
    immutable: false,
  } as User;

  const createComponent = createComponentFactory({
    component: AdditionalDetailsSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockProvider(FilesystemService),
      mockProvider(UserFormStore, {
        isStigMode: jest.fn(() => false),
        updateUserConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(() => null),
        isNewUser: jest.fn(() => false),
        homeModeOldValue: jest.fn(() => ''),
        userConfig: jest.fn(() => ({})),
        shellAccess: jest.fn(() => shellAccess()),
        state$: of({
          setupDetails: {
            allowedAccess: {
              shellAccess: shellAccess(),
            },
          },
        }),
      }),
      mockApi([
        mockCall('user.shell_choices', {
          '/usr/sbin/nologin': 'nologin',
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
        mockCall('group.query', [
          {
            id: 101,
            group: 'test-group',
          },
          {
            id: 102,
            group: 'test-group-2',
          },
          {
            id: 103,
            group: 'test-group-3',
          },
        ] as Group[]),
        mockCall('sharing.smb.query', []),
        mockCall('filesystem.stat', {
          mode: 16889,
        } as FileSystemStat),
      ]),
    ],
  });

  describe('when creating a new user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      shellAccess.set(false);
    });

    it('checks initial value when creating a new user', () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        full_name: '',
        email: null,
        shell: '/usr/bin/zsh',
        group_create: true,
        groups: [],
        group: null,
        home: '/var/empty',
        home_mode: '700',
        home_create: false,
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        uid: null,
      });
      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('fill editables with custom value', async () => {
      await (await loader.getHarness(DetailsTableHarness)).setValues({
        'Full Name': 'Editable field',
        Email: 'editable@truenas.local',
        Groups: 'test-group',
        UID: 1234,
      });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenLastCalledWith({
        full_name: 'Editable field',
        email: 'editable@truenas.local',
        shell: '/usr/bin/zsh',
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        group_create: true,
        group: null,
        groups: [],
        home: '/var/empty',
        home_mode: '700',
        home_create: false,
        uid: '1234',
      });
    });

    it('checks zsh shell is selected when shell access is enabled', async () => {
      shellAccess.set(true);
      spectator.detectChanges();

      const editables = await loader.getHarness(DetailsTableHarness);
      expect(await editables.getValues()).toEqual(expect.objectContaining({
        Shell: '/usr/bin/zsh',
      }));
    });
  });

  describe('when editing a user', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          editingUser: mockUser,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      shellAccess.set(false);
    });

    it('checks initial value when editing user', async () => {
      shellAccess.set(true);
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(values).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Primary Group: test-group  Auxiliary Groups: test-group-2, test-group-3',
        'Home Directory': '/home/test',
        UID: '1004',
        Shell: '/usr/bin/bash',
      });

      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('loads home share path and puts it in home field', async () => {
      const homeInput = await loader.getHarness(DetailsItemHarness.with({ label: 'Home Directory' }));
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.query', [[['enabled', '=', true], ['options.home', '=', true]]]);
      expect(await homeInput.getValueText()).toBe('/home/test');
    });

    it('check uid field is disabled', async () => {
      const editables = await loader.getHarness(DetailsTableHarness);

      expect(await editables.getValues()).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Primary Group: test-group  Auxiliary Groups: test-group-2, test-group-3',
        'Home Directory': '/home/test',
        UID: '1004',
      });

      const uidField = await editables.getHarnessForItem('UID', EditableHarness);
      await uidField.open();

      spectator.detectChanges();

      const uidInput = await loader.getHarness(IxInputHarness.with({ selector: '[aria-label="UID"]' }));
      expect(await uidInput.isDisabled()).toBeTruthy();
    });
  });

  describe('home directory fields', () => {
    it('disables permissions when home directory is empty', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const checkbox = await loader.getAllHarnesses(MatCheckboxHarness.with({ label: /Default Permissions/ }));
      await checkbox[0].uncheck();

      const perms = await loader.getHarness(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      expect(await perms.isDisabled()).toBe(true);
    });

    it('enables permissions after setting a home directory', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));
      await createCheckbox.setValue(true);

      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      await explorer.setValue('/mnt/tank/user');
      spectator.detectChanges();

      const checkbox = await loader.getAllHarnesses(MatCheckboxHarness.with({ label: /Default Permissions/ }));
      await checkbox[0].uncheck();

      const perms = await loader.getHarness(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      expect(await perms.isDisabled()).toBe(false);
    });

    it('resets permissions when create home directory is checked', async () => {
      spectator = createComponent({
        props: { editingUser: mockUser },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const checkbox = await loader.getAllHarnesses(MatCheckboxHarness.with({ label: /Default Permissions/ }));
      await checkbox[0].uncheck();

      const perms = await loader.getHarness(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      await perms.setValue('755');

      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));
      await createCheckbox.setValue(true);
      spectator.detectChanges();

      expect(await perms.getValue()).toBe('700');
    });
  });

  describe('immutable user', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, immutable: true } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('disables home directory related fields', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const explorer = await loader.getHarnessOrNull(IxExplorerHarness.with({ label: 'Home Directory' }));
      const perms = await loader.getHarnessOrNull(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));

      expect(await explorer.isDisabled()).toBe(true);
      expect(await createCheckbox.isDisabled()).toBe(true);
      expect(perms).toBeNull();
    });
  });
});
