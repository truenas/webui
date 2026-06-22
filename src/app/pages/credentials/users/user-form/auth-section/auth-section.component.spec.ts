import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnRadioHarness } from '@truenas/ui-components';
import { AuthSectionComponent } from 'app/pages/credentials/users/user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/users/user-form/user.store';

describe('AuthSectionComponent', () => {
  let spectator: Spectator<AuthSectionComponent>;
  let loader: HarnessLoader;

  const smbAccess = signal(false);
  const sshAccess = signal(false);
  const isStigMode = signal(false);

  const createComponent = createComponentFactory({
    component: AuthSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UserFormStore, {
        smbAccess,
        sshAccess,
        isStigMode,
        updateUserConfig: jest.fn(),
        setAllowedAccessConfig: jest.fn(),
      }),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(TnInputHarness.with({ name }));
  const getInputOrNull = (name: string): Promise<TnInputHarness | null> => loader.getHarnessOrNull(
    TnInputHarness.with({ name }),
  );
  const getCheckbox = (label: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ label }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    smbAccess.set(false);
    sshAccess.set(false);
    isStigMode.set(false);
  });

  describe('password fields', () => {
    it('shows Password, Confirm Password and "Disable Password" fields when creating a new user', async () => {
      expect(await (await getInput('password')).getValue()).toBe('');
      expect(await (await getInput('password_confirm')).getValue()).toBe('');
      expect(await (await getCheckbox('Disable Password')).isChecked()).toBe(false);
    });

    it('updates the store when password fields are changed', async () => {
      await (await getInput('password')).setValue('new-password');

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        password: 'new-password',
      }));

      await (await getCheckbox('Disable Password')).check();
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        password_disabled: true,
      }));
    });

    it('disables password fields when Disable Password is ticked', async () => {
      await (await getCheckbox('Disable Password')).check();

      expect(await (await getInput('password')).isDisabled()).toBe(true);
      expect(await (await getInput('password_confirm')).isDisabled()).toBe(true);
      expect(await (await getCheckbox('Disable Password')).isDisabled()).toBe(false);
    });

    it('shows validation error when passwords do not match', async () => {
      await (await getInput('password')).setValue('password123');
      await (await getInput('password_confirm')).setValue('different-password');
      spectator.detectChanges();

      // Check that the validator sets the correct error
      expect(spectator.component.form.controls.password_confirm.hasError('matchOther')).toBe(true);
      expect(spectator.component.form.controls.password_confirm.errors?.['matchOther']).toEqual({
        message: 'Passwords do not match',
      });
    });

    it('does not show validation error when passwords match', async () => {
      await (await getInput('password')).setValue('password123');
      await (await getInput('password_confirm')).setValue('password123');
      spectator.detectChanges();

      expect(spectator.component.form.controls.password_confirm.hasError('matchOther')).toBe(false);
    });

    it('shows password confirmation field only when password is entered for editing user', async () => {
      spectator.setInput('editingUser', { id: 1, username: 'test' });
      spectator.detectChanges();

      // Initially, no confirmation field should be visible
      expect(await getInputOrNull('password_confirm')).toBeNull();

      // After entering password, confirmation field should appear
      await (await getInput('password')).setValue('newpassword');
      expect(await getInputOrNull('password_confirm')).not.toBeNull();
    });

    it('validates password confirmation is required for new users', () => {
      // For new users, password_confirm should be required
      expect(spectator.component.form.controls.password_confirm.hasValidator(Validators.required)).toBe(true);

      spectator.component.form.controls.password_confirm.markAsTouched();
      spectator.detectChanges();

      expect(spectator.component.form.controls.password_confirm.hasError('required')).toBe(true);
    });

    it('does not require password confirmation for editing users initially', () => {
      spectator.setInput('editingUser', { id: 1, username: 'test' });
      spectator.detectChanges();

      // For editing users, password_confirm should not be required initially
      expect(spectator.component.form.controls.password_confirm.hasValidator(Validators.required)).toBe(false);
    });

    it('checks stig mode fields when "STIG Mode" is true', async () => {
      isStigMode.set(true);
      spectator.detectChanges();

      const option = await loader.getHarness(
        TnRadioHarness.with({ label: 'Generate Temporary One-Time Password' }),
      );
      await option.check();

      expect(await option.isChecked()).toBe(true);
    });

    it('shows "Disable Password" as disabled and unchecked when smbAccess is enabled', async () => {
      smbAccess.set(true);
      spectator.detectChanges();

      const disablePasswordCheckbox = await getCheckbox('Disable Password');
      expect(await disablePasswordCheckbox.isDisabled()).toBe(true);
      expect(await disablePasswordCheckbox.isChecked()).toBe(false);
    });

    it('enables "Disable Password" checkbox when smbAccess is disabled', async () => {
      // Start with SMB enabled
      smbAccess.set(true);
      spectator.detectChanges();

      expect(await (await getCheckbox('Disable Password')).isDisabled()).toBe(true);

      // Disable SMB access
      smbAccess.set(false);
      spectator.detectChanges();

      // Checkbox should now be enabled
      const disablePasswordCheckbox = await getCheckbox('Disable Password');
      expect(await disablePasswordCheckbox.isDisabled()).toBe(false);

      // Should be able to toggle the checkbox
      await disablePasswordCheckbox.check();
      expect(await disablePasswordCheckbox.isChecked()).toBe(true);
    });

    // TODO: it shows "Change Password" field when editing a user that has a password

    it('shows Disable Password ticked when editing a user that has password disabled', async () => {
      sshAccess.set(true);
      spectator.setInput('editingUser', {
        password_disabled: true,
        ssh_password_enabled: false,
        sshpubkey: 'ssh-rsa AAAAB3...',
      });
      spectator.detectChanges();

      expect(await (await getCheckbox('Disable Password')).isChecked()).toBe(true);
      expect(await (await getCheckbox('Disable Password')).isDisabled()).toBe(false);
      expect(await (await getCheckbox('Allow SSH Login with Password (not recommended)')).isDisabled()).toBe(true);
    });

    it('shows Disable Password ticked when editing a user with password disabled and ssh_password_enabled inconsistency', async () => {
      sshAccess.set(true);
      spectator.setInput('editingUser', {
        password_disabled: true,
        ssh_password_enabled: true,
        sshpubkey: '',
      });
      spectator.detectChanges();

      expect(await (await getCheckbox('Disable Password')).isChecked()).toBe(true);
      expect(await (await getCheckbox('Disable Password')).isDisabled()).toBe(false);
      expect(await (await getCheckbox('Allow SSH Login with Password (not recommended)')).isDisabled()).toBe(true);
    });

    it('shows different set of fields when system is in STIG mode', async () => {
      isStigMode.set(true);
      spectator.detectChanges();

      const radios = await loader.getAllHarnesses(TnRadioHarness);
      const labels = await Promise.all(radios.map((radio) => radio.getLabelText()));
      expect(labels).toEqual([
        'Disable Password',
        'Generate Temporary One-Time Password',
      ]);
    });

    // TODO: Expand on test case for Generate Temporary One-Time Password.
  });

  describe('SSH fields', () => {
    beforeEach(() => {
      sshAccess.set(true);
    });

    it('shows SSH fields when SSH Access is enabled', async () => {
      expect(await getInputOrNull('sshpubkey')).not.toBeNull();
      expect(await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ label: 'Allow SSH Login with Password (not recommended)' }),
      )).not.toBeNull();
    });

    it('provides SSH access through key-based authentication when password is disabled', async () => {
      // When password is disabled, users can still get SSH access via SSH keys
      await (await getCheckbox('Disable Password')).check();

      // SSH key field should still be available for SSH access
      expect(await getInputOrNull('sshpubkey')).not.toBeNull();

      // User can enter an SSH key to enable SSH access
      await (await getInput('sshpubkey')).setValue('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      }));
    });

    it('disables Disable Password when "Allow SSH Login with Password" is set', async () => {
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(await (await getCheckbox('Disable Password')).isDisabled()).toBe(true);
    });

    it('requires validation when SSH access is enabled but no authentication method is provided', async () => {
      // SSH password should not be automatically enabled - users need to choose
      expect(await (await getCheckbox('Allow SSH Login with Password (not recommended)')).isChecked()).toBe(false);

      // Without any authentication method, form should have validation error
      expect(spectator.component.form.hasError('sshAccessRequired')).toBe(true);
    });

    it('updates the store when SSH fields are changed', async () => {
      await (await getInput('sshpubkey')).setValue('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      }));

      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        ssh_password_enabled: true,
      }));
    });

    it('shows current user SSH settings when editing a user', async () => {
      spectator.setInput('editingUser', {
        sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
        ssh_password_enabled: true,
      });

      expect(await (await getInput('sshpubkey')).getValue()).toBe('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');
      expect(await (await getCheckbox('Allow SSH Login with Password (not recommended)')).isChecked()).toBe(true);
    });

    it('validates that SSH access requires at least one authentication method', async () => {
      // Without auto-enable logic, SSH password should be false by default
      expect(spectator.component.form.value.ssh_password_enabled).toBe(false);

      // Form should have SSH access validation error since no authentication method is configured
      expect(spectator.component.form.hasError('sshAccessRequired')).toBe(true);

      // Enable SSH password authentication should remove the error
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();
      expect(spectator.component.form.hasError('sshAccessRequired')).toBe(false);

      // Disable SSH password authentication should bring back the error
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).uncheck();
      expect(spectator.component.form.hasError('sshAccessRequired')).toBe(true);

      // Adding SSH key should remove SSH access error
      await (await getInput('sshpubkey')).setValue('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');
      expect(spectator.component.form.hasError('sshAccessRequired')).toBe(false);
    });
  });

  describe('SSH password enabled validation', () => {
    beforeEach(() => {
      sshAccess.set(true);
    });

    it('shows validation error when SSH password enabled without valid home directory', async () => {
      spectator.setInput('homeDirectory', '');
      spectator.setInput('shell', '/usr/bin/bash');
      spectator.detectChanges();

      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(true);
      expect(spectator.component.form.getError('ssh_password_enabled')).toEqual({
        message: 'Cannot be enabled without a valid home path and login shell.',
      });
    });

    it('shows validation error when SSH password enabled without valid shell', async () => {
      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.setInput('shell', '/usr/sbin/nologin');
      spectator.detectChanges();

      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(true);
      expect(spectator.component.form.getError('ssh_password_enabled')).toEqual({
        message: 'Cannot be enabled without a valid home path and login shell.',
      });
    });

    it('does not show validation error when SSH password enabled with valid home and shell', async () => {
      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.setInput('shell', '/usr/bin/bash');
      spectator.detectChanges();

      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);
    });

    it('revalidates when home directory changes', async () => {
      spectator.setInput('homeDirectory', '');
      spectator.setInput('shell', '/usr/bin/bash');
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();
      spectator.detectChanges();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(true);

      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.detectChanges();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);
    });

    it('revalidates when shell changes', async () => {
      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.setInput('shell', '/usr/sbin/nologin');
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();
      spectator.detectChanges();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(true);

      spectator.setInput('shell', '/usr/bin/bash');
      spectator.detectChanges();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);
    });

    it('does not validate when SSH password is not enabled', async () => {
      spectator.setInput('homeDirectory', '');
      spectator.setInput('shell', '/usr/sbin/nologin');
      spectator.detectChanges();

      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).uncheck();

      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);
    });

    it('does not validate when SSH access is disabled even if password checkbox is checked', async () => {
      // Setup initial state with SSH access enabled and valid home/shell
      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.setInput('shell', '/usr/bin/bash');
      spectator.detectChanges();

      // Fill in required password fields to make form valid
      await (await getInput('password')).setValue('test-password');
      await (await getInput('password_confirm')).setValue('test-password');
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();
      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);

      // Now disable SSH access (simulating unchecking SSH Access in allowed-access-section)
      sshAccess.set(false);
      spectator.detectChanges();

      // Change shell to nologin (which happens when shell access is disabled)
      spectator.setInput('shell', '/usr/sbin/nologin');
      spectator.detectChanges();

      // The ssh_password_enabled validator should not run because SSH access is disabled
      // This validates the fix for the reported bug https://ixsystems.atlassian.net/browse/NAS-138307
      expect(spectator.component.form.hasError('ssh_password_enabled')).toBe(false);
    });

    it('clears SSH key and password fields when SSH access is disabled', async () => {
      // Setup initial state with SSH access enabled
      spectator.setInput('homeDirectory', '/mnt/tank/user');
      spectator.setInput('shell', '/usr/bin/bash');
      spectator.detectChanges();

      // Set SSH key and enable SSH password login
      await (await getInput('password')).setValue('test-password');
      await (await getInput('password_confirm')).setValue('test-password');
      await (await getInput('sshpubkey')).setValue('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');
      await (await getCheckbox('Allow SSH Login with Password (not recommended)')).check();

      expect(spectator.component.form.value.sshpubkey).toBe('ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...');
      expect(spectator.component.form.value.ssh_password_enabled).toBe(true);

      // Disable SSH access (simulating unchecking SSH Access checkbox in allowed-access-section)
      sshAccess.set(false);
      spectator.detectChanges();

      // Both SSH fields should be cleared
      expect(spectator.component.form.value.sshpubkey).toBe('');
      expect(spectator.component.form.value.ssh_password_enabled).toBe(false);
    });
  });
});
