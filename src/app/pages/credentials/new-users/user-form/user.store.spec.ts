import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Choices } from 'app/interfaces/choices.interface';
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
        mockCall('user.update'),
        mockCall('user.shell_choices', {
          '/usr/bin/bash': 'bash',
          '/usr/bin/zsh': 'zsh',
        } as Choices),
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

  it('checks payload on submit', () => {
    spectator.service.initialize();
    spectator.service.updateUserConfig({
      username: 'operator',
      full_name: 'Operator',
      password: 'password123',
      email: 'operator@truenas.local',
      shell: '/usr/bin/zsh',
      smb: true,
    });
    spectator.service.createUser();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [{
      full_name: 'Operator',
      password: 'password123',
      email: 'operator@truenas.local',
      shell: '/usr/bin/zsh',
      smb: true,
      sudo_commands: [],
      sudo_commands_nopasswd: [],
      uid: 1004,
      username: 'operator',
    }]);
  });

  it('checks payload on edit user', () => {
    spectator.service.initialize();
    spectator.service.updateUserConfig({
      uid: 1004,
      username: 'test',
      full_name: 'Test User',
      home: '/home/test',
      shell: '/usr/bin/bash',
      smb: true,
      ssh_password_enabled: true,
      password_disabled: false,
      sudo_commands_nopasswd: ['rm -rf /'],
      sudo_commands: [allCommands],
      group: 101,
      groups: [101],
    });
    spectator.service.updateSetupDetails({
      allowedAccess: {
        smbAccess: true,
        truenasAccess: false,
        sshAccess: false,
        shellAccess: false,
      },
    });

    spectator.service.updateUser(1000, spectator.service.userConfig());

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [1000, {
      full_name: 'Test User',
      home: '/home/test',
      shell: '/usr/bin/bash',
      smb: true,
      group: 101,
      groups: [101],
      ssh_password_enabled: true,
      password_disabled: false,
      sudo_commands: [allCommands],
      sudo_commands_nopasswd: ['rm -rf /'],
      uid: 1004,
      username: 'test',
    }]);
  });

  // TODO: Add more tests
});
