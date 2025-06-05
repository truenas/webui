import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFileInputHarness } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxRadioGroupHarness } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { IxTextareaHarness } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AuthSectionComponent } from 'app/pages/credentials/new-users/user-form/auth-section/auth-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('AuthSectionComponent', () => {
  let spectator: Spectator<AuthSectionComponent>;
  let loader: HarnessLoader;
  const sshAccessEnabled = signal(false);
  const isStigMode = signal(false);
  const isNewUser = signal(true);

  const createComponent = createComponentFactory({
    component: AuthSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxValidatorsService, {
        validateOnCondition: jest.fn(),
      }),
      mockProvider(UserFormStore, {
        updateUserConfig: jest.fn(),
        smbAccess: jest.fn(() => false),
        sshAccess: jest.fn(() => sshAccessEnabled()),
        isStigMode: jest.fn(() => isStigMode()),
        isNewUser: jest.fn(() => isNewUser()),
        setAllowedAccessConfig: jest.fn(),
      }),
    ],
  });

  describe('when new user', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      isNewUser.set(true);
    });

    it('checks initial value', () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        password: '',
        password_disabled: undefined,
        ssh_password_enabled: false,
        sshpubkey: '',
      });
    });

    it('checks password fields when "New User" is true', async () => {
      expect(await loader.getHarness(IxSlideToggleHarness.with({ label: 'Disable Password' }))).toBeTruthy();
      expect(await loader.getHarness(IxSlideToggleHarness.with({ label: 'Set Password' }))).toBeTruthy();
      expect(await loader.getHarness(IxInputHarness.with({ label: 'Password' }))).toBeTruthy();
      expect(await loader.getHarness(IxInputHarness.with({ label: 'Confirm Password' }))).toBeTruthy();
    });

    it('checks SSH fields when "SSH Access" checkbox is true', async () => {
      sshAccessEnabled.set(true);

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
      spectator.setInput('editingUser', {

      });
      isNewUser.set(false);
    });

    it('checks initial value', () => {
      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenCalledWith({
        password: '',
        password_disabled: undefined,
        ssh_password_enabled: false,
        sshpubkey: '',
      });
    });

    it('checks password fields when "New User" is false', async () => {
      isStigMode.set(true);

      expect(await loader.getHarness(IxSlideToggleHarness.with({ label: 'Disable Password' }))).toBeTruthy();

      const changePassword = await loader.getHarness(IxSlideToggleHarness.with({ label: 'Change Password' }));
      await changePassword.setValue(true);

      expect(await changePassword.getValue()).toBeTruthy();

      expect(await loader.getHarness(IxInputHarness.with({ label: 'New Password' }))).toBeTruthy();
      expect(await loader.getHarness(IxInputHarness.with({ label: 'Confirm New Password' }))).toBeTruthy();
    });

    it('checks SSH fields when "SSH Access" checkbox is true', async () => {
      sshAccessEnabled.set(true);

      expect(await loader.getHarness(IxCheckboxHarness.with({ label: 'Allow SSH Login with Password (not recommended)' }))).toBeTruthy();
      expect(await loader.getHarness(IxTextareaHarness.with({ label: 'Public SSH Keys' }))).toBeTruthy();
      expect(await loader.getHarness(IxFileInputHarness.with({ label: 'Upload SSH Key' }))).toBeTruthy();
    });
  });

  // TODO: Add more tests
});
