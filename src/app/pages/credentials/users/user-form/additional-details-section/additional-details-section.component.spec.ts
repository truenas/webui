import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
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
import { IxPermissionsHarness } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/users/user-form/user.store';
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
        isNewUser: jest.fn(() => false),
        homeModeOldValue: jest.fn(() => ''),
        userConfig: jest.fn(() => ({})),
        shellAccess: jest.fn(() => shellAccess()),
        role: jest.fn(),
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

  beforeEach(() => {
    // Mock scrollIntoView since it's not available in test environment
    Element.prototype.scrollIntoView = jest.fn();
  });

  describe('sudo commands fields', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { editingUser: mockUser },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      shellAccess.set(true);
    });

    it('displays initial sudo command values correctly', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const values = await table.getValues();

      expect(values['Sudo Commands']).toContain('Allowed sudo commands: ALL');
      expect(values['Sudo Commands']).toContain('Allowed Sudo Commands (No Password): rm -rf /');
    });

    it('shows "Not Set" when sudo commands are empty', async () => {
      spectator = createComponent({
        props: {
          editingUser: { ...mockUser, sudo_commands: [], sudo_commands_nopasswd: [] },
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const values = await table.getValues();

      expect(values['Sudo Commands']).toBe('Not Set');
    });
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
        shell: '/usr/sbin/nologin',
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
        shell: '/usr/sbin/nologin',
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        group_create: true,
        group: null,
        groups: [],
        home: '/var/empty',
        home_mode: '700',
        home_create: false,
        uid: 1234,
      });
    });

    it('checks zsh shell is selected when shell access is enabled', fakeAsync(async () => {
      shellAccess.set(true);
      spectator.detectChanges();

      tick();

      const editables = await loader.getHarness(DetailsTableHarness);
      expect(await editables.getValues()).toEqual(expect.objectContaining({
        Shell: '/usr/bin/zsh',
      }));
    }));
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
        Groups: 'Primary Group: test-group  Auxiliary Groups:  test-group-2, test-group-3',
        'Home Directory': '/home/test',
        Shell: '/usr/bin/bash',
        'Sudo Commands': 'Allowed sudo commands: ALL  Allowed Sudo Commands (No Password): rm -rf /',
      });

      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('does not show UID on edit', async () => {
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(Object.keys(values)).not.toContain('UID');
    });

    it('loads home share path and puts it in home field', async () => {
      const homeInput = await loader.getHarness(DetailsItemHarness.with({ label: 'Home Directory' }));
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.smb.query', [[['enabled', '=', true], ['options.home', '=', true]]]);
      expect(await homeInput.getValueText()).toBe('/home/test');
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

      const checkbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      if (checkbox) {
        await checkbox.setValue(false);
      }

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

      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Create Home Directory Under' }));
      await explorer.setValue('/mnt/tank/user');
      spectator.detectChanges();

      const checkbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      if (checkbox) {
        await checkbox.setValue(false);
      }

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

      const checkbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      if (checkbox) {
        await checkbox.setValue(false);
      }

      const perms = await loader.getHarness(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      await perms.setValue('755');

      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));
      await createCheckbox.setValue(true);
      spectator.detectChanges();

      // When "Create Home Directory" is checked, it should set default permissions and hide the permissions component
      expect(spectator.component.form.controls.default_permissions.value).toBe(true);
      expect(spectator.component.form.controls.home_mode.value).toBe('700');

      // The permissions component should be hidden when default_permissions is true
      const hiddenPerms = await loader.getHarnessOrNull(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      expect(hiddenPerms).toBeNull();
    });

    it('remains visible when home directory path is cleared and defaults to /var/empty', async () => {
      spectator = createComponent({
        props: { editingUser: mockUser },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      // Open the editable field
      await homeEditable.open();

      // Get the explorer and clear the value
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      await explorer.setValue('');
      spectator.detectChanges();

      // Close the editable by pressing escape
      await homeEditable.tryToClose();

      // The field should still be visible and show the user's original home as placeholder
      expect(await homeEditable.getShownValue()).toBe('/home/test');

      // Verify that the store was updated with the default path
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          home: '/var/empty',
        }),
      );

      // Should be able to open and edit again
      await homeEditable.open();
      const reopenedExplorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      expect(await reopenedExplorer.isDisabled()).toBe(false);
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

  describe('default permissions checkbox', () => {
    it('syncs checkbox state based on form values', () => {
      spectator = createComponent();

      // Test default permissions (700)
      spectator.component.form.patchValue({ home_mode: '700' });
      expect(spectator.component.form.controls.default_permissions.value).toBe(true);

      // Test custom permissions (755)
      spectator.component.form.patchValue({ home_mode: '755' });
      expect(spectator.component.form.controls.default_permissions.value).toBe(false);

      // Test setting default_permissions back to true
      spectator.component.form.patchValue({ default_permissions: true });
      expect(spectator.component.form.controls.home_mode.value).toBe('700');
    });

    it('always includes home_mode in user config updates', () => {
      spectator = createComponent();
      const updateSpy = jest.spyOn(spectator.inject(UserFormStore), 'updateUserConfig');

      // Set custom permissions
      spectator.component.form.patchValue({
        home_mode: '755',
        default_permissions: false,
      });

      // Trigger the form value change subscription
      spectator.detectChanges();

      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          home_mode: '755',
        }),
      );
    });

    it('hides permissions entirely for users with /var/empty home path', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '/var/empty' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      // Trigger the setupEditUserForm logic
      spectator.detectChanges();

      // Should hide the entire permissions section for /var/empty users
      expect(spectator.component.shouldShowPermissions()).toBe(false);

      // The permissions components should not be present in DOM
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const defaultPermsCheckbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      const permissionsComponent = await loader.getHarnessOrNull(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));

      expect(defaultPermsCheckbox).toBeNull();
      expect(permissionsComponent).toBeNull();
    });

    it('shows permissions for users with regular home directories', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '/home/test' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      spectator.detectChanges();

      // Should show permissions section for regular home directories
      expect(spectator.component.shouldShowPermissions()).toBe(true);

      // The permissions components should be present in DOM
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const defaultPermsCheckbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      expect(defaultPermsCheckbox).not.toBeNull();
    });
  });
});
