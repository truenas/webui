import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserAccessCardComponent } from 'app/pages/credentials/users/all-users/user-details/user-access-card/user-access-card.component';
import { UserLastActionComponent } from 'app/pages/credentials/users/all-users/user-details/user-last-action/user-last-action.component';
import {
  ApiKeyFormComponent,
} from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { DownloadService } from 'app/services/download.service';

const mockUser = {
  id: 1,
  username: 'testuser',
  locked: false,
  local: true,
  password_disabled: false,
  ssh_password_enabled: true,
  sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA...',
  smb: true,
  shell: '/bin/bash',
  sudo_commands: ['command1', 'command2'],
  sudo_commands_nopasswd: ['command3'],
  api_keys: [1, 2],
  roles: [Role.FullAdmin],
  twofactor_auth_configured: true,
  password_change_required: true,
} as User;

const mockGlobalTwoFactorConfig: GlobalTwoFactorConfig = {
  id: 1,
  enabled: true,
  window: 0,
  services: { ssh: false },
};

function createTestComponent(
  globalTwoFactorConfig: GlobalTwoFactorConfig = mockGlobalTwoFactorConfig,
): ReturnType<typeof createComponentFactory<UserAccessCardComponent>> {
  return createComponentFactory({
    component: UserAccessCardComponent,
    imports: [
      IxIconComponent,
      RequiresRolesDirective,
    ],
    declarations: [
      MockComponent(UserLastActionComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(ApiService),
      mockProvider(AuthService, {
        getGlobalTwoFactorConfig: jest.fn(() => of(globalTwoFactorConfig)),
        hasRole: jest.fn(() => of(true)),
        user$: of({ pw_name: 'testuser' }),
      }),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('user.update'),
        mockCall('user.unset_2fa_secret'),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({})),
      }),
      mockProvider(DownloadService, {
        downloadBlob: jest.fn(),
      }),
    ],
  });
}

describe('UserAccessCardComponent', () => {
  let spectator: Spectator<UserAccessCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createTestComponent();

  beforeEach(() => {
    spectator = createComponent({
      props: { user: mockUser },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should render user access card', () => {
    expect(spectator.query('h3')).toHaveText('Access');
  });

  it('contains last action component', () => {
    expect(spectator.query(UserLastActionComponent)).toBeTruthy();
  });

  it('should display password availability', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-of-type(2)');
    expect(passwordSection).toHaveText('Has Password');
    expect(passwordSection).toContainText('Change Required');
  });

  it('should display 2FA access status', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-of-type(3)');
    expect(passwordSection).toHaveText('Has Two-Factor Authentication');
  });

  it('should display SMB access status', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-of-type(5)');
    expect(passwordSection).toHaveText('Has SMB Access');
  });

  it('should display roles', () => {
    const rolesSection = spectator.query('.content-wrapper:nth-of-type(6)');
    expect(rolesSection).toHaveText('TrueNAS Access: Full Admin');
  });

  it('should display API keys count', () => {
    const apiKeysSection = spectator.query('.content-wrapper:nth-of-type(7)');
    expect(apiKeysSection).toHaveText('API Keys: 2 keys');
  });

  it('should display SSH access status', () => {
    const sshSection = spectator.query('.content-wrapper:nth-of-type(8)');
    expect(sshSection).toHaveText('SSH Key Set & Password Login Enabled');
  });

  it('should display Shell Access status', () => {
    const shellAccessSection = spectator.query('.content-wrapper:nth-of-type(9)');
    expect(shellAccessSection).toHaveText('Shell Access: /bin/bash');

    const additionalShellAccessInfo = spectator.query('.additional-info');
    expect(additionalShellAccessInfo).toHaveText('Allowed sudo commands: command1, command2  Allowed Sudo Commands (No Password): command3');
  });

  it('clears two-factor authentication when Clear Two-Factor Authentication is clicked', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Two-Factor Authentication' }));
    await button.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.unset_2fa_secret', [mockUser.username]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Two-Factor Authentication settings cleared');
  });

  it('should open lock user when button Lock User is clicked', async () => {
    const lockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Lock User' }));
    await lockButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [mockUser.id, {
      locked: true,
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('should unlock user when Unlock is clicked', async () => {
    spectator.setInput('user', { ...mockUser, locked: true });

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock User' }));
    await unlockButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [mockUser.id, {
      locked: false,
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  it('should not show Lock User button if this is a built-in user (other than root)', async () => {
    spectator.setInput('user', { ...mockUser, builtin: true, username: 'testuser' });

    const lockButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Lock User' }));
    expect(lockButton).toBeNull();

    // Check root
    spectator.setInput('user', { ...mockUser, builtin: true, username: 'root' });
    const rootLockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Lock User' }));
    expect(rootLockButton).toBeTruthy();
  });

  describe('API Keys', () => {
    it('shows API keys count', () => {
      const apiKeysSection = spectator.query('.content-wrapper:nth-of-type(7) .flex-container');
      expect(apiKeysSection).toHaveText('API Keys: 2 keys');
    });

    it('has an View API keys link that takes user to API keys page', () => {
      const link = spectator.query(byText('View API Keys'));

      expect(link).toHaveAttribute('href', '/credentials/users/api-keys?userName=testuser');
    });

    it('shows an Add API Key link that opens the form to add the key', () => {
      spectator.setInput('user', {
        ...mockUser,
        api_keys: [],
      });

      spectator.click(spectator.query(byText('Add API Key')));

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ApiKeyFormComponent, {
        data: {
          username: mockUser.username,
        },
      });
    });

    it('downloads ssh key when Download Key link is clicked', () => {
      const downloadLink = spectator.query(byText('Download Key'));
      spectator.click(downloadLink);

      expect(spectator.inject(DownloadService).downloadBlob).toHaveBeenCalledWith(
        new Blob([mockUser.sshpubkey], { type: 'text/plain' }),
        `${mockUser.username}_public_key_rsa`,
      );
    });
  });

  describe('Two-Factor Authentication', () => {
    let twoFactorSpectator: Spectator<UserAccessCardComponent>;
    const createFactory = createTestComponent({
      ...mockGlobalTwoFactorConfig,
      enabled: true,
    });

    it('shows "Set up 2FA" link for current user when 2FA is not configured', () => {
      twoFactorSpectator = createFactory({
        props: {
          user: {
            ...mockUser,
            twofactor_auth_configured: false,
          },
        },
      });

      const link = twoFactorSpectator.query(byText('Set up 2FA'));

      expect(link).toBeTruthy();
      expect(link).toHaveAttribute('href', '/two-factor-auth');
    });

    it('does not show "Set up 2FA" link when 2FA is already configured', () => {
      twoFactorSpectator = createFactory({
        props: {
          user: {
            ...mockUser,
            twofactor_auth_configured: true,
          },
        },
      });

      const link = twoFactorSpectator.query(byText('Set up 2FA'));

      expect(link).toBeFalsy();
    });
  });

  describe('Two-Factor Authentication - Other User', () => {
    let otherUserSpectator: Spectator<UserAccessCardComponent>;
    const createFactory = createComponentFactory({
      component: UserAccessCardComponent,
      imports: [
        IxIconComponent,
        RequiresRolesDirective,
      ],
      declarations: [
        MockComponent(UserLastActionComponent),
      ],
      providers: [
        mockAuth(),
        mockProvider(ApiService),
        mockProvider(AuthService, {
          getGlobalTwoFactorConfig: jest.fn(() => of({
            ...mockGlobalTwoFactorConfig,
            enabled: true,
          })),
          hasRole: jest.fn(() => of(true)),
          user$: of({ pw_name: 'differentuser' }), // Different user
        }),
        mockProvider(SnackbarService),
        mockProvider(DialogService, {
          confirm: jest.fn(() => of(true)),
        }),
        mockApi([
          mockCall('user.update'),
          mockCall('user.unset_2fa_secret'),
        ]),
        mockProvider(SlideIn, {
          open: jest.fn(() => of({})),
        }),
        mockProvider(DownloadService, {
          downloadBlob: jest.fn(),
        }),
      ],
    });

    it('does not show "Set up 2FA" link for other users', () => {
      otherUserSpectator = createFactory({
        props: {
          user: {
            ...mockUser,
            twofactor_auth_configured: false,
          },
        },
      });

      const link = otherUserSpectator.query(byText('Set up 2FA'));

      expect(link).toBeFalsy();
    });
  });

  describe('Two-Factor Authentication - Disabled', () => {
    let disabledSpectator: Spectator<UserAccessCardComponent>;
    const createFactory = createTestComponent({
      ...mockGlobalTwoFactorConfig,
      enabled: false,
    });

    it('does not show 2FA section when global 2FA is disabled', () => {
      disabledSpectator = createFactory({
        props: {
          user: {
            ...mockUser,
            twofactor_auth_configured: false,
          },
        },
      });

      // When global 2FA is disabled, the entire 2FA section should not be displayed
      const twoFactorText = disabledSpectator.query(byText('No Two-Factor Authentication'));
      const link = disabledSpectator.query(byText('Set up 2FA'));

      expect(twoFactorText).toBeFalsy();
      expect(link).toBeFalsy();
    });
  });
});
