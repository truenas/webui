import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { allCommands } from 'app/constants/all-commands.constant';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { Role } from 'app/enums/role.enum';
import { Choices } from 'app/interfaces/choices.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserFormStore, UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user.store';

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
          webshareAccess: false,
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
      group: 1001,
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
      group: 1001,
      smb: true,
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
      webshare: false,
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
        webshareAccess: false,
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
      webshare: false,
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

  describe('computed signals', () => {
    it('should return correct smbAccess value', () => {
      spectator.service.setAllowedAccessConfig({
        smbAccess: true,
        webshareAccess: false,
        truenasAccess: false,
        sshAccess: false,
        shellAccess: false,
      });

      expect(spectator.service.smbAccess()).toBe(true);
    });

    it('should return correct webshareAccess value', () => {
      spectator.service.setAllowedAccessConfig({
        smbAccess: false,
        webshareAccess: true,
        truenasAccess: false,
        sshAccess: false,
        shellAccess: false,
      });

      expect(spectator.service.webshareAccess()).toBe(true);
    });

    it('should return correct sshAccess value', () => {
      spectator.service.setAllowedAccessConfig({
        smbAccess: false,
        webshareAccess: false,
        truenasAccess: false,
        sshAccess: true,
        shellAccess: false,
      });

      expect(spectator.service.sshAccess()).toBe(true);
    });

    it('should return correct shellAccess value', () => {
      spectator.service.setAllowedAccessConfig({
        smbAccess: false,
        webshareAccess: false,
        truenasAccess: false,
        sshAccess: false,
        shellAccess: true,
      });

      expect(spectator.service.shellAccess()).toBe(true);
    });

    it('should return correct truenasAccess value', () => {
      spectator.service.setAllowedAccessConfig({
        smbAccess: false,
        webshareAccess: false,
        truenasAccess: true,
        sshAccess: false,
        shellAccess: false,
      });

      expect(spectator.service.truenasAccess()).toBe(true);
    });

    it('should return correct isStigMode value', () => {
      spectator.service.initialize();
      expect(spectator.service.isStigMode()).toBe(false);
    });
  });

  describe('setAllowedAccessConfig', () => {
    it('should update allowed access configuration', () => {
      const newConfig = {
        smbAccess: false,
        webshareAccess: true,
        truenasAccess: true,
        sshAccess: true,
        shellAccess: true,
      };

      spectator.service.setAllowedAccessConfig(newConfig);

      expect(spectator.service.state().setupDetails.allowedAccess).toEqual(newConfig);
    });
  });

  describe('updateSetupDetails', () => {
    it('should update setup details partially', () => {
      spectator.service.updateSetupDetails({
        defaultPermissions: false,
      });

      expect(spectator.service.state().setupDetails.defaultPermissions).toBe(false);
      // Other fields should remain unchanged
      expect(spectator.service.state().setupDetails.stigPassword).toBe(UserStigPasswordOption.DisablePassword);
    });

    it('should update homeModeOldValue', () => {
      spectator.service.updateSetupDetails({
        homeModeOldValue: '755',
      });

      expect(spectator.service.homeModeOldValue()).toBe('755');
    });

    it('should update role', () => {
      spectator.service.updateSetupDetails({
        role: 'readonly_admin' as Role,
      });

      expect(spectator.service.role()).toBe('readonly_admin');
    });

    it('should update stigPassword option', () => {
      spectator.service.updateSetupDetails({
        stigPassword: UserStigPasswordOption.OneTimePassword,
      });

      expect(spectator.service.state().setupDetails.stigPassword).toBe(UserStigPasswordOption.OneTimePassword);
    });
  });

  describe('updateUserConfig', () => {
    it('should merge new user config with existing config', () => {
      spectator.service.updateUserConfig({
        username: 'john',
        full_name: 'John Doe',
      });

      expect(spectator.service.userConfig()).toEqual({
        username: 'john',
        full_name: 'John Doe',
      });

      // Update with additional fields
      spectator.service.updateUserConfig({
        email: 'john@example.com',
      });

      expect(spectator.service.userConfig()).toEqual({
        username: 'john',
        full_name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  describe('createUser with STIG mode', () => {
    it('should create user with disabled password in STIG mode', () => {
      spectator.service.initialize();
      spectator.service.updateSetupDetails({
        stigPassword: UserStigPasswordOption.DisablePassword,
      });
      spectator.service.updateUserConfig({
        username: 'operator',
        full_name: 'Operator',
        password_disabled: true,
      });

      spectator.service.createUser();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [{
        full_name: 'Operator',
        password: null,
        password_disabled: true,
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        uid: null,
        username: 'operator',
      }]);
    });

    it('should create user with one-time password in STIG mode', () => {
      spectator.service.initialize();
      spectator.service.updateSetupDetails({
        stigPassword: UserStigPasswordOption.OneTimePassword,
      });
      spectator.service.updateUserConfig({
        username: 'operator',
        full_name: 'Operator',
      });

      spectator.service.createUser();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.create', [{
        full_name: 'Operator',
        password: null,
        random_password: true,
        sudo_commands: [],
        sudo_commands_nopasswd: [],
        uid: null,
        username: 'operator',
      }]);
    });
  });

  describe('updateUser with home_create', () => {
    it('should make two API calls when home_create is true', () => {
      spectator.service.initialize();
      spectator.service.updateUserConfig({
        username: 'test',
        home: '/mnt/tank/home/test',
        home_create: true,
        shell: '/usr/bin/bash',
      });

      spectator.service.updateUser(1000, spectator.service.userConfig()).subscribe();

      // First call to create home directory
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [1000, {
        home_create: true,
        home: '/mnt/tank/home/test',
      }]);

      // Second call should update user without home_create
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [1000, {
        username: 'test',
        shell: '/usr/bin/bash',
      }]);
    });

    it('should make single API call when home_create is false', () => {
      spectator.service.initialize();
      spectator.service.updateUserConfig({
        username: 'test',
        home: '/mnt/tank/home/test',
        shell: '/usr/bin/bash',
      });

      spectator.service.updateUser(1000, spectator.service.userConfig()).subscribe();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('user.update', [1000, {
        username: 'test',
        home: '/mnt/tank/home/test',
        shell: '/usr/bin/bash',
      }]);
    });
  });

  describe('isNewUser signal', () => {
    it('should be true by default', () => {
      expect(spectator.service.isNewUser()).toBe(true);
    });

    it('should be settable', () => {
      spectator.service.isNewUser.set(false);
      expect(spectator.service.isNewUser()).toBe(false);
    });
  });
});
