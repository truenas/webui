import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject, map } from 'rxjs';
import { allCommands } from 'app/constants/all-commands.constant';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { DetailsTableHarness } from 'app/modules/details-table/details-table.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxPermissionsHarness } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AdditionalDetailsSectionComponent } from 'app/pages/credentials/users/user-form/additional-details-section/additional-details-section.component';
import { UserFormStore } from 'app/pages/credentials/users/user-form/user.store';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AdditionalDetailsSectionComponent', () => {
  let spectator: Spectator<AdditionalDetailsSectionComponent>;
  let loader: HarnessLoader;

  const shellAccess = signal(false);
  const shellAccess$ = new BehaviorSubject(false);
  function setShellAccess(value: boolean): void {
    shellAccess.set(value);
    shellAccess$.next(value);
  }
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
        state$: shellAccess$.pipe(map((sa) => ({
          setupDetails: {
            allowedAccess: {
              shellAccess: sa,
            },
            role: null as null,
          },
        }))),
      }),
      mockProvider(SnackbarService),
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
    setShellAccess(false);
  });

  describe('sudo commands fields', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { editingUser: mockUser },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      setShellAccess(true);
    });

    it('displays initial sudo command values correctly', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const values = await table.getValues();

      expect(values['Sudo Commands']).toContain('Allowed Sudo Commands: All');
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
      setShellAccess(false);
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
        home_create: true,
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
        home_create: true,
        uid: 1234,
      });
    });

    it('clears default path and adds required validator when home editable is opened', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      // Before opening, home should be defaultHomePath
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');

      await homeEditable.open();

      // After opening with home_create=true, defaultHomePath should be cleared
      expect(spectator.component.form.controls.home.value).toBe('');

      // Required validator should be active
      expect(spectator.component.form.controls.home.hasError('required')).toBe(true);
    });

    it('restores default path and removes required validator when home editable is closed with empty path', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      await homeEditable.open();

      // Uncheck home_create to remove required validator, allowing close with empty path
      spectator.component.form.controls.home_create.setValue(false);
      spectator.detectChanges();

      await homeEditable.tryToClose();

      // Empty path should be restored to defaultHomePath
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');
      expect(spectator.component.form.controls.home.hasError('required')).toBe(false);
    });

    it('keeps user-set path and removes required validator when home editable is closed with a real path', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      await homeEditable.open();

      // Set a real path so we can close
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      await explorer.setValue('/mnt/tank/user');
      spectator.detectChanges();

      await homeEditable.tryToClose();

      // Required validator should be removed
      expect(spectator.component.form.controls.home.hasError('required')).toBe(false);
      // User-set path should be preserved (not reset to defaultHomePath)
      expect(spectator.component.form.controls.home.value).toBe('/mnt/tank/user');
    });

    it('removes required validator when home_create is unchecked while editable is open', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      await homeEditable.open();

      // home_create is true by default, so required validator should be active
      expect(spectator.component.form.controls.home.hasError('required')).toBe(true);

      // Uncheck home_create
      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));
      await createCheckbox.setValue(false);

      // Required validator should be removed and default path restored
      expect(spectator.component.form.controls.home.hasError('required')).toBe(false);
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');
    });

    it('preserves API validation error when home editable auto-opens', async () => {
      const homeControl = spectator.component.form.controls.home;
      homeControl.setValue('/var/empty/2');

      // Simulate API validation error set by FormErrorHandlerService
      homeControl.setErrors({
        manualValidateError: true,
        manualValidateErrorMsg: '"Home Directory" must begin with /mnt or set to /var/empty.',
        ixManualValidateError: { message: '"Home Directory" must begin with /mnt or set to /var/empty.' },
      });
      homeControl.markAsTouched();

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      // API error should be preserved, not cleared by syncHomeValidators
      expect(homeControl.errors?.manualValidateError).toBe(true);
      expect(homeControl.value).toBe('/var/empty/2');
    });

    it('checks zsh shell is selected when shell access is enabled', fakeAsync(async () => {
      setShellAccess(true);
      spectator.detectChanges();

      tick();

      const editables = await loader.getHarness(DetailsTableHarness);
      expect(await editables.getValues()).toEqual(expect.objectContaining({
        Shell: '/usr/bin/zsh',
      }));
    }));

    it('pre-populates home with SMB share path for new users when a home share exists', () => {
      const mockApiService = spectator.inject(MockApiService);
      mockApiService.mockCall('sharing.smb.query', [{ path: '/mnt/tank/homes', enabled: true }] as never);

      spectator = createComponent();

      expect(spectator.component.form.controls.home.value).toBe('/mnt/tank/homes');
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
      setShellAccess(false);
    });

    it('checks initial value when editing user', async () => {
      setShellAccess(true);
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(values).toEqual({
        'Full Name': 'test',
        Email: 'Not Set',
        Groups: 'Primary Group: test-group  Auxiliary Groups:  test-group-2, test-group-3',
        'Home Directory': '/home/test',
        Shell: '/usr/bin/bash',
        'Sudo Commands': 'Allowed Sudo Commands: All  Allowed Sudo Commands (No Password): rm -rf /',
      });

      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        defaultPermissions: true,
      });
    });

    it('does not show UID on edit', async () => {
      const values = await (await loader.getHarness(DetailsTableHarness)).getValues();

      expect(Object.keys(values)).not.toContain('UID');
    });

    it('skips SMB home share query when editing a user to preserve existing home path', () => {
      const smbCalls = (spectator.inject(ApiService).call as jest.Mock).mock.calls
        .filter(([method]: [string]) => method === 'sharing.smb.query');
      expect(smbCalls).toHaveLength(0);
    });

    it('does not modify home validators when home editable is opened for an existing user', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      await homeEditable.open();

      // For editing users, onHomeEditableOpened early-returns — home value should be unchanged
      expect(spectator.component.form.controls.home.value).toBe('/home/test');
      expect(spectator.component.form.controls.home.hasError('required')).toBe(false);
    });

    it('does not modify home validators when home editable is closed for an existing user', async () => {
      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);

      await homeEditable.open();
      await homeEditable.tryToClose();

      // For editing users, onHomeEditableClosed early-returns — home value should be unchanged
      expect(spectator.component.form.controls.home.value).toBe('/home/test');
      expect(spectator.component.form.controls.home.hasError('required')).toBe(false);
    });
  });

  describe('home directory fields', () => {
    it('normalizes empty home directory to default path and hides permissions', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      // Empty home should be normalized to /var/empty
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');

      // Permissions should not be shown for /var/empty
      const perms = await loader.getHarnessOrNull(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      expect(perms).toBeNull();
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

      const checkbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      if (checkbox) {
        await checkbox.setValue(false);
      }

      const perms = await loader.getHarness(IxPermissionsHarness.with({ label: 'Home Directory Permissions' }));
      expect(await perms.isDisabled()).toBe(false);
    });

    it('switches explorer label to "Create Home Directory Under" after path is set', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const createCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Create Home Directory' }));
      await createCheckbox.setValue(true);

      // Before setting a path, label should be 'Home Directory'
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      expect(explorer).toBeTruthy();

      // Set a real path
      await explorer.setValue('/mnt/tank/user');
      spectator.detectChanges();

      // After setting a path, label should switch to 'Create Home Directory Under'
      const explorerWithNewLabel = await loader.getHarnessOrNull(IxExplorerHarness.with({ label: 'Create Home Directory Under' }));
      expect(explorerWithNewLabel).toBeTruthy();
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

      // The field should still be visible and show the normalized default path
      expect(await homeEditable.getShownValue()).toBe('/var/empty');

      // Verify that the form control was normalized to the default path
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');

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

    it('handles empty → valid → empty flow correctly', async () => {
      spectator = createComponent({
        props: { editingUser: { ...mockUser, home: '' } },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      // Start with empty home - should be normalized to /var/empty
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      // Set a valid path
      const explorer = await loader.getHarness(IxExplorerHarness.with({ label: 'Home Directory' }));
      await explorer.setValue('/mnt/tank/users/testuser');
      spectator.detectChanges();

      expect(spectator.component.form.controls.home.value).toBe('/mnt/tank/users/testuser');
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          home: '/mnt/tank/users/testuser',
        }),
      );

      // Clear the path again
      await explorer.setValue('');
      spectator.detectChanges();

      // Should be normalized back to /var/empty
      expect(spectator.component.form.controls.home.value).toBe('/var/empty');
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          home: '/var/empty',
        }),
      );
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

      spectator.detectChanges();

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

      const table = await loader.getHarness(DetailsTableHarness);
      const homeEditable = await table.getHarnessForItem('Home Directory', EditableHarness);
      await homeEditable.open();

      const defaultPermsCheckbox = await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Default Permissions' }));
      expect(defaultPermsCheckbox).not.toBeNull();
    });
  });

  describe('primary and auxiliary group mutual exclusion', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          editingUser: mockUser,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('removes primary group from auxiliary groups when primary group changes', () => {
      // Set auxiliary groups to include group 102 and 103
      spectator.component.form.controls.groups.patchValue([102, 103]);

      // Change primary group to 102 (which is in auxiliary groups)
      spectator.component.form.controls.group.patchValue(102);

      // Group 102 should be filtered out of auxiliary groups
      expect(spectator.component.form.controls.groups.value).toEqual([103]);
    });

    it('shows snackbar when primary group is removed from auxiliary groups', () => {
      spectator.component.form.controls.groups.patchValue([102, 103]);

      spectator.component.form.controls.group.patchValue(102);

      expect(spectator.inject(SnackbarService).open).toHaveBeenCalledWith({
        message: 'test-group-2 was removed from auxiliary groups.',
      });
    });

    it('clears primary group and shows snackbar when it is added to auxiliary groups', () => {
      spectator.component.form.controls.group.patchValue(101);

      spectator.component.form.controls.groups.patchValue([101, 103]);

      expect(spectator.component.form.controls.group.value).toBeNull();
      expect(spectator.inject(SnackbarService).open).toHaveBeenCalledWith({
        message: 'test-group was removed as primary group.',
      });
    });
  });
});
