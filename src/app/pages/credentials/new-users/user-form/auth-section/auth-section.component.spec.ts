import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('AuthSectionComponent', () => {
  let spectator: Spectator<AuthSectionComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const smbAccess = signal(false);
  const sshAccess = signal(false);
  const isStigMode = signal(false);
  const isNewUser = signal(true);

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
        isNewUser,
        updateUserConfig: jest.fn(),
        setAllowedAccessConfig: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    smbAccess.set(false);
    sshAccess.set(false);
    isStigMode.set(false);
    isNewUser.set(true);
  });

  describe('password fields', () => {
    it('shows Password and "Disable Password" fields when creating a new user', async () => {
      expect(await form.getValues()).toMatchObject({
        Password: '',
        'Disable Password': false,
      });
    });

    it('updates the store when password fields are changed', async () => {
      await form.fillForm({ Password: 'new-password' });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        password: 'new-password',
      }));

      await form.fillForm({ 'Disable Password': true });
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        password_disabled: true,
      }));
    });

    it('disables password field when Disable Password is ticked', async () => {
      await form.fillForm({ 'Disable Password': true });

      expect(await loader.getHarness(IxCheckboxHarness.with({ label: 'Allow SSH Login with Password (not recommended)' }))).toBeTruthy();
      expect(await loader.getHarness(IxTextareaHarness.with({ label: 'Public SSH Keys' }))).toBeTruthy();
      expect(await loader.getHarness(IxFileInputHarness.with({ label: 'Upload SSH Key' }))).toBeTruthy();
    });

    it('checks stig mode fields when "STIG Mode" is true', async () => {
      isStigMode.set(true);

      const password = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Password' }));
      await password.setValue('Generate Temporary One-Time Password');

      const value = await password.getValue();
      expect(value).toBe('Generate Temporary One-Time Password');
    });
  });

  describe('when editing user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      spectator.setInput('editingUser', {});
      isNewUser.set(false);
      smbAccess.set(false);
      sshAccess.set(false);
      isStigMode.set(false);
    });

    it('checks initial value', async () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        password: '',
        password_disabled: false,
        ssh_password_enabled: false,
        sshpubkey: '',
      });

      expect(await form.getDisabledState()).toEqual({
        'Change Password': true,
        'Disable Password': false,
      });
    });

    it('does not show "Disable Password" when smbAccess is enabled', async () => {
      smbAccess.set(true);

      expect(await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Disable Password' }))).toBeNull();
    });

    // TODO: it shows "Change Password" field when editing a user that has a password
    // TODO: shows Disable Password ticked when editing a user that has no password

    it('shows different set of fields when system is in STIG mode', async () => {
      isStigMode.set(true);

      const passwordGroup = await loader.getHarness(IxRadioGroupHarness.with({ label: 'Password' }));
      expect(passwordGroup).toBeTruthy();
      expect(await passwordGroup.getOptionLabels()).toEqual([
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

    // TODO: Editing scenarios;

    it('shows SSH fields when SSH Access is enabled', async () => {
      expect(await loader.getHarness(IxTextareaHarness.with({ label: 'Public SSH Key' }))).toBeTruthy();
      expect(await loader.getHarness(IxCheckboxHarness.with({ label: 'Allow SSH Login with Password (not recommended)' }))).toBeTruthy();
    });

    it('disables "Allow SSH Login with Password" when password is disabled', async () => {
      await form.fillForm({ 'Disable Password': true });

      expect(await form.getDisabledState()).toMatchObject({
        'Allow SSH Login with Password (not recommended)': true,
      });
    });

    it('disables Disable Password when "Allow SSH Login with Password" is set', async () => {
      await form.fillForm({ 'Allow SSH Login with Password (not recommended)': true });

      expect(await form.getDisabledState()).toMatchObject({
        'Disable Password': true,
      });
    });

    it('updates the store when SSH fields are changed', async () => {
      await form.fillForm({
        'Public SSH Key': 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ...',
      }));

      await form.fillForm({ 'Allow SSH Login with Password (not recommended)': true });

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith(expect.objectContaining({
        ssh_password_enabled: true,
      }));
    });
  });
});
