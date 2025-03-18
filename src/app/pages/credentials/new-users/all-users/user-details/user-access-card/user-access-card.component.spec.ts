import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { UsersStore } from 'app/pages/credentials/new-users/store/users.store';
import { UrlOptionsService } from 'app/services/url-options.service';
import { UserAccessCardComponent } from './user-access-card.component';

const mockUser = {
  id: 1,
  username: 'testuser',
  locked: false,
  password_disabled: false,
  ssh_password_enabled: true,
  sshpubkey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA...',
  smb: true,
  shell: '/bin/bash',
  api_keys: [1, 2],
  roles: [Role.FullAdmin],
  twofactor_auth_configured: true,
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
      mockProvider(Router),
      mockProvider(ApiService),
      mockProvider(LoaderService),
      mockProvider(UsersStore),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('user.update'),
      ]),
      mockProvider(UrlOptionsService),
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

  it('should display API keys count', () => {
    const apiKeysSection = spectator.query('.content-wrapper:nth-child(7)');
    expect(apiKeysSection).toHaveText('Api Keys: 2 keys');
  });

  it('should display Shell Access status', () => {
    const apiKeysSection = spectator.query('.content-wrapper:nth-child(8)');
    expect(apiKeysSection).toHaveText('Shell Access: /bin/bash');
  });

  it('should display SSH access status', () => {
    const sshSection = spectator.query('.content-wrapper:nth-child(9)');
    expect(sshSection).toHaveText('Key set, Password login enabled');
  });

  it('should call viewLogs when Search Logs link is clicked', () => {
    const spy = jest.spyOn(spectator.component, 'viewLogs');
    const viewLogsLink = spectator.query('.last-login a');
    expect(viewLogsLink).toHaveText('Search Logs');
    spectator.click(viewLogsLink);
    expect(spy).toHaveBeenCalled();
  });

  it('should open lock/unlock dialog when button is clicked', async () => {
    const lockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Lock User' }));
    await lockButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [mockUser.id, {
      locked: true,
    }]);
  });

  it('should navigate to API keys page when "View API Keys" link is clicked', () => {
    const spy = jest.spyOn(spectator.inject(Router), 'navigate');
    const addApiKeyLink = spectator.query('.content-wrapper:nth-child(7) a');
    spectator.click(addApiKeyLink);

    expect(spy).toHaveBeenCalledWith(['/credentials/users/api-keys'], {
      queryParams: { userName: mockUser.username },
    });
  });
});
