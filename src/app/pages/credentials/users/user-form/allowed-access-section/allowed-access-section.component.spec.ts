import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/users/user-form/allowed-access-section/allowed-access-section.component';
import { UserFormStore } from 'app/pages/credentials/users/user-form/user.store';

describe('AllowedAccessSectionComponent', () => {
  let spectator: Spectator<AllowedAccessSectionComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AllowedAccessSectionComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(UserFormStore, {
        setAllowedAccessConfig: jest.fn(),
        updateSetupDetails: jest.fn(),
        role: jest.fn(),
        updateUserConfig: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('when new user', () => {
    it('checks form controls', async () => {
      const smbAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);

      const webshareAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isChecked()).toBe(false);

      const truenasAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isChecked()).toBe(false);

      const sshAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SSH Access' }));
      expect(await sshAccessCheckbox.isChecked()).toBe(false);

      const shellAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(false);
    });
  });

  describe('when existing user', () => {
    beforeEach(() => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: true,
        webshare: false,
        shell: '/usr/bin/bash',
        sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC...',
        roles: [Role.FullAdmin],
        ssh_password_enabled: true,
      });
    });

    it('checks form controls', async () => {
      const sshAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SSH Access' }));
      expect(await sshAccessCheckbox.isChecked()).toBe(true);

      const smbAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);

      const webshareAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isChecked()).toBe(false);

      const shellAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(true);

      const truenasAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isChecked()).toBe(true);
    });

    it('updates allowed access config on form changes', () => {
      spectator.detectChanges();

      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
        smbAccess: true,
        webshareAccess: false,
        truenasAccess: true,
        sshAccess: true,
        shellAccess: true,
      });
    });
  });

  it('updates store when allowed access checkboxes are changed', async () => {
    const smbCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SMB Access' }));
    const shellCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));

    await smbCheckbox.check();
    await shellCheckbox.check();

    expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
      smbAccess: true,
      webshareAccess: false,
      truenasAccess: false,
      sshAccess: false,
      shellAccess: true,
    });
  });

  it('shows role field when TrueNAS access is selected', async () => {
    const truenasCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(IxSelectHarness);
    expect(roleInput).toBeTruthy();

    const options = await roleInput.getOptionLabels();
    expect(options).toEqual([
      'Select Role',
      'Full Admin',
      'Sharing Admin',
      'Readonly Admin',
    ]);
  });

  it('updates store when role is changed', async () => {
    const truenasCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(IxSelectHarness);
    await roleInput.setValue('Full Admin');

    expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
      smbAccess: true,
      webshareAccess: false,
      truenasAccess: true,
      sshAccess: false,
      shellAccess: false,
    });

    expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
      role: Role.FullAdmin,
    });
  });

  describe('SMB access validation', () => {
    it('does not show validation error for new users', () => {
      spectator.component.form.controls.smb.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(false);
    });

    it('shows validation error when enabling SMB for existing user without password', () => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: false,
        roles: [],
      } as User);
      spectator.setInput('password', '');
      spectator.detectChanges();

      spectator.component.form.controls.smb.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(true);
      expect(spectator.component.form.getError('smb')).toEqual({
        message: 'Password must be reset in order to enable SMB authentication',
      });
    });

    it('does not show validation error when enabling SMB for existing user with password', () => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: false,
        roles: [],
      } as User);
      spectator.setInput('password', 'newpassword123');
      spectator.detectChanges();

      spectator.component.form.controls.smb.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(false);
    });

    it('does not show validation error when SMB was already enabled', () => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: true,
        roles: [],
      } as User);
      spectator.setInput('password', '');
      spectator.detectChanges();

      spectator.component.form.controls.smb.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(false);
    });

    it('revalidates when password changes', () => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: false,
        roles: [],
      } as User);
      spectator.setInput('password', '');
      spectator.component.form.controls.smb.setValue(true);
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(true);

      spectator.setInput('password', 'newpassword123');
      spectator.detectChanges();

      expect(spectator.component.form.hasError('smb')).toBe(false);
    });
  });
});
