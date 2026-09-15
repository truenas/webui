import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
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
      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);

      const webshareAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isChecked()).toBe(false);

      const truenasAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isChecked()).toBe(false);

      const sshAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SSH Access' }));
      expect(await sshAccessCheckbox.isChecked()).toBe(false);

      const shellAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(false);
    });
  });

  describe('when a create flow presets the section', () => {
    it('turns SMB access off and locks the checkbox', async () => {
      spectator.setInput('preset', { values: { smb: false }, locked: ['smb'] });

      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(false);
      expect(await smbAccessCheckbox.isDisabled()).toBe(true);
    });

    it('tells the store SMB access is off, rather than that it is unknown', () => {
      spectator.setInput('preset', { values: { smb: false }, locked: ['smb'] });

      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenLastCalledWith(
        expect.objectContaining({ smbAccess: false }),
      );
    });

    it('keeps telling the store SMB is off when a sibling control changes', async () => {
      // The locked control is dropped from `valueChanges`, and the store's
      // config is spread rather than merged — so reporting the emission
      // instead of the raw value would replace `smb: false` with `undefined`
      // here, and `user.create` would go out saying nothing about SMB at all.
      spectator.setInput('preset', { values: { smb: false }, locked: ['smb'] });

      const truenasAccess = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
      await truenasAccess.check();

      expect(spectator.inject(UserFormStore).updateUserConfig).toHaveBeenLastCalledWith(
        expect.objectContaining({ smb: false }),
      );
      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenLastCalledWith(
        expect.objectContaining({ smbAccess: false }),
      );
    });

    it('sets the value without locking it when the flow names no lock', async () => {
      spectator.setInput('preset', { values: { smb: false } });

      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(false);
      expect(await smbAccessCheckbox.isDisabled()).toBe(false);
    });

    it('stops applying an unlocked value once it has, so a tick of the user\'s stands', async () => {
      // A host binding an object literal hands this a new reference every
      // change-detection pass; re-applying would undo the tick each time and
      // the user could never turn SMB access on at all.
      spectator.setInput('preset', { values: { smb: false } });

      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      await smbAccessCheckbox.check();

      spectator.setInput('preset', { values: { smb: false } });

      expect(await smbAccessCheckbox.isChecked()).toBe(true);
    });

    it('leaves the checkbox alone without a preset', async () => {
      spectator.setInput('preset', undefined);

      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);
      expect(await smbAccessCheckbox.isDisabled()).toBe(false);
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
      const sshAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SSH Access' }));
      expect(await sshAccessCheckbox.isChecked()).toBe(true);

      const smbAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);

      const webshareAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isChecked()).toBe(false);

      const shellAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(true);

      const truenasAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
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

  describe('when existing user with webshare enabled', () => {
    it('shows WebShare Access checkbox as checked when user has webshare enabled', async () => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: true,
        webshare: true,
        roles: [],
      });

      const webshareAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isChecked()).toBe(true);
    });
  });

  describe('root user restrictions', () => {
    it('disables webshare and truenas access for root user', async () => {
      spectator.setInput('editingUser', {
        uid: 0,
        username: 'root',
        smb: true,
        webshare: false,
        roles: [Role.FullAdmin],
      } as User);
      spectator.detectChanges();

      const webshareAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isDisabled()).toBe(true);

      const truenasAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isDisabled()).toBe(true);

      const truenasAccessDropdown = await loader.getHarness(TnSelectHarness);
      expect(await truenasAccessDropdown.isDisabled()).toBe(true);
    });

    it('keeps reporting root\'s TrueNAS access, though its control is disabled', () => {
      // Reported from the raw value, so the three controls this section locks
      // for root keep their say. On the emitted value they read `undefined`,
      // which sent `role: null` to the store — and the details section strips
      // a role's group from the account when the role goes null, which for
      // root is the one account that must not lose it.
      spectator.setInput('editingUser', {
        uid: 0,
        username: 'root',
        smb: true,
        webshare: false,
        roles: [Role.FullAdmin],
      } as User);
      spectator.detectChanges();

      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenLastCalledWith(
        expect.objectContaining({ truenasAccess: true, webshareAccess: false }),
      );
      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenLastCalledWith(
        expect.objectContaining({ role: Role.FullAdmin }),
      );
    });

    it('allows webshare and truenas access for non-root users', async () => {
      spectator.setInput('editingUser', {
        uid: 1001,
        username: 'not-root',
        smb: true,
        webshare: false,
        roles: [Role.FullAdmin],
      } as User);
      spectator.detectChanges();

      const webshareAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'WebShare Access' }));
      expect(await webshareAccessCheckbox.isDisabled()).toBe(false);

      const truenasAccessCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isDisabled()).toBe(false);

      const truenasAccessDropdown = await loader.getHarness(TnSelectHarness);
      expect(await truenasAccessDropdown.isDisabled()).toBe(false);
    });
  });

  it('updates store when allowed access checkboxes are changed', async () => {
    const smbCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'SMB Access' }));
    const shellCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Shell Access' }));

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
    const truenasCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(TnSelectHarness);
    expect(roleInput).toBeTruthy();

    const options = await roleInput.getOptions();
    expect(options).toEqual([
      'Select Role',
      'Full Admin',
      'Sharing Admin',
      'Readonly Admin',
    ]);
  });

  it('updates store when role is changed', async () => {
    const truenasCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'TrueNAS Access' }));
    await truenasCheckbox.check();

    const roleInput = await loader.getHarness(TnSelectHarness);
    await roleInput.selectOption('Full Admin');

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
