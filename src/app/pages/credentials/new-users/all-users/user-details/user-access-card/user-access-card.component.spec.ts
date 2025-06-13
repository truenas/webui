import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { byText } from '@ngneat/spectator';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ApiKeyFormComponent,
} from 'app/pages/credentials/users/user-api-keys/components/api-key-form/api-key-form.component';
import { DownloadService } from 'app/services/download.service';
import { UserAccessCardComponent } from './user-access-card.component';

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
  api_keys: [1, 2],
  roles: [Role.FullAdmin],
  twofactor_auth_configured: true,
  password_change_required: true,
} as User;

describe('UserAccessCardComponent', () => {
  let spectator: Spectator<UserAccessCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UserAccessCardComponent,
    imports: [
      IxIconComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(ApiService),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('user.update'),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({})),
      }),
      mockProvider(DownloadService, {
        downloadBlob: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { user: mockUser },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should render user access card', () => {
    expect(spectator.query('h3')).toHaveText('Access');
  });

  it('should show last login section', () => {
    expect(spectator.query('.last-login')).toHaveText('Last Login: N/A');
  });

  it('should display password availability', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-child(3)');
    expect(passwordSection).toHaveText('Has Password');
    expect(passwordSection).toContainText('Change Required');
  });

  it('should display 2FA access status', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-child(4)');
    expect(passwordSection).toHaveText('Has Two-Factor Authentication');
  });

  it('should display SMB access status', () => {
    const passwordSection = spectator.query('.content-wrapper:nth-child(5)');
    expect(passwordSection).toHaveText('Has SMB Access');
  });

  it('should display roles', () => {
    const rolesSection = spectator.query('.content-wrapper:nth-child(6)');
    expect(rolesSection).toHaveText('TrueNAS Access: Full Admin');
  });

  it('should display Shell Access status', () => {
    const apiKeysSection = spectator.query('.content-wrapper:nth-child(8)');
    expect(apiKeysSection).toHaveText('Shell Access: /bin/bash');
  });

  it('should display SSH access status', () => {
    const sshSection = spectator.query('.content-wrapper:nth-child(9)');
    expect(sshSection).toHaveText('SSH Key Set & Password Login Enabled');
  });

  it('has a Search Logs link that takes user to the audit page', () => {
    const link = spectator.query(byText('Search Logs'));

    expect(link).toHaveAttribute(
      'href',
      '/system/audit/%7B%22searchQuery%22:%7B%22isBasicQuery%22:false,%22filters%22:%5B%5B%22username%22,%22%3D%22,%22testuser%22%5D%5D%7D%7D',
    );
  });

  it('should lock/unlock user when corresponding button is clicked', async () => {
    const lockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Lock User' }));
    await lockButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [mockUser.id, {
      locked: true,
    }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });

  describe('API Keys', () => {
    it('shows API keys count', () => {
      const apiKeysSection = spectator.query('.content-wrapper:nth-child(7)');
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
});
