import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Choices } from 'app/interfaces/choices.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormStore } from 'app/pages/credentials/new-users/user-form/user.store';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';

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
    expect(spectator.service.state()).toEqual({
      isStigMode: false,
      setupDetails: {
        allowedAccess: {
          shellAccess: false,
          smbAccess: true,
          sshAccess: false,
          truenasAccess: false,
        },
        defaultPermissions: true,
        homeModeOldValue: '',
        role: null,
        stigPassword: UserStigPasswordOption.DisablePassword,
      },
      userConfig: null,
    });
  });

  it('checks payload on submit', () => {
    spectator.service.initialize();
    spectator.service.updateUserConfig({
      username: 'operator',
      full_name: 'Operator',
      password: 'password123',
    });
    spectator.service.createUser();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [{
      full_name: 'Operator',
      group_create: true,
      home: '/var/empty',
      password: 'password123',
      shell: '/usr/sbin/nologin',
      smb: true,
      ssh_password_enabled: false,
      sudo_commands: [],
      sudo_commands_nopasswd: [],
      uid: null,
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
