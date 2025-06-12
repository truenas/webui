import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Role } from 'app/enums/role.enum';
import { AllowedAccessSectionComponent } from 'app/pages/credentials/new-users/user-form/allowed-access-section/allowed-access-section.component';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

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
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('when new user', () => {
    it('checks initial value', () => {
      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
        smbAccess: true,
        truenasAccess: false,
        sshAccess: false,
        shellAccess: false,
      });
      expect(spectator.inject(UserFormStore).updateSetupDetails).toHaveBeenCalledWith({
        role: 'prompt',
      });
    });

    it('checks form controls', async () => {
      const sshAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SSH Access' }));
      expect(await sshAccessCheckbox.isChecked()).toBe(false);

      const smbAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'SMB Access' }));
      expect(await smbAccessCheckbox.isChecked()).toBe(true);

      const shellAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(false);

      const truenasAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isChecked()).toBe(false);
    });
  });

  describe('when existing user', () => {
    beforeEach(() => {
      spectator.setInput('editingUser', {
        username: 'test',
        smb: true,
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

      const shellAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'Shell Access' }));
      expect(await shellAccessCheckbox.isChecked()).toBe(true);

      const truenasAccessCheckbox = await loader.getHarness(MatCheckboxHarness.with({ label: 'TrueNAS Access' }));
      expect(await truenasAccessCheckbox.isChecked()).toBe(true);
    });

    it('updates allowed access config on form changes', () => {
      spectator.detectChanges();

      expect(spectator.inject(UserFormStore).setAllowedAccessConfig).toHaveBeenCalledWith({
        smbAccess: true,
        truenasAccess: true,
        sshAccess: true,
        shellAccess: true,
      });
    });
  });

  // TODO: Add more tests
});
