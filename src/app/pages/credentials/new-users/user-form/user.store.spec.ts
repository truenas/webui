import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';

describe('UserFormStore', () => {
  let spectator: SpectatorService<UserFormStore>;
  const createComponent = createServiceFactory({
    service: UserFormStore,
    providers: [
      mockApi([
        mockCall('system.security.config', {
          enable_gpos_stig: false,
        } as SystemSecurityConfig),
        mockCall('user.get_next_uid', 1004),
        mockCall('user.create'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('checks initial value', () => {
    expect(spectator.service.isStigMode()).toBe(false);
    expect(spectator.service.nextUid()).toBeNull();
    expect(spectator.service.userConfig()).toBeNull();
    expect(spectator.service.isNewUser()).toBe(true);
    expect(spectator.service.smbAccess()).toBe(true);
    expect(spectator.service.shellAccess()).toBe(false);
    expect(spectator.service.truenasAccess()).toBe(false);
    expect(spectator.service.sshAccess()).toBe(false);
    expect(spectator.service.role()).toBe('prompt');
  });

  it('loads next uid and stig mode', () => {
    spectator.service.initialize();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.security.config');
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.get_next_uid');
  });

  // TODO: Add more tests
});
