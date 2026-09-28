import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { firstValueFrom } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { UserService } from 'app/services/user.service';

type Group = WebUiQueryEntity<'group.query'>;
type User = WebUiQueryEntity<'user.query'>;
type UserObj = CallResponse<WebUiApiDirectory, 'user.get_user_obj'>;

describe('UserService', () => {
  let spectator: SpectatorService<UserService>;
  let apiService: MockTypedApiService;

  const createService = createServiceFactory({
    service: UserService,
    providers: [
      mockTypedApi(),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    apiService = spectator.inject(MockTypedApiService);
  });

  describe('groupQueryDsCache', () => {
    it('queries groups without search term', async () => {
      const mockGroups = [
        { id: 1, name: 'admin', builtin: true } as Group,
        { id: 2, name: 'users', builtin: false } as Group,
      ];

      apiService.mockQuery('group.query', mockGroups);

      const groups = await firstValueFrom(spectator.service.groupQueryDsCache('', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [], { limit: 50, offset: 0, order_by: ['builtin'] });
      expect(groups).toEqual(mockGroups);
    });

    it('queries groups with search term', async () => {
      const mockGroups = [{ id: 1, name: 'admin', builtin: true } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.groupQueryDsCache('admin', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['group', '~', '(?i).*admin']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('filters out built-in groups when hideBuiltIn is true', async () => {
      const mockGroups = [{ id: 1, name: 'users', builtin: false } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.groupQueryDsCache('', true, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['builtin', '=', false]], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('trims search input', async () => {
      const mockGroups = [{ id: 1, name: 'admin', builtin: true } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.groupQueryDsCache('  admin  ', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['group', '~', '(?i).*admin']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });


    it('escapes backslashes in search term', async () => {
      const mockGroups = [] as Group[];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.groupQueryDsCache('test\\path', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['group', '~', '(?i).*test\\\\path']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('includes extra filters in the query', async () => {
      const mockGroups = [{ id: 1, name: 'local-group', builtin: false } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.groupQueryDsCache('test', false, 0, [
        ['local', '=', true],
        ['immutable', '=', false],
      ]));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['local', '=', true], ['immutable', '=', false], ['group', '~', '(?i).*test']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });
  });

  describe('smbGroupQueryDsCache', () => {
    it('queries SMB groups only', async () => {
      const mockGroups = [{ id: 1, name: 'smb-group', smb: true } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['smb', '=', true]], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('queries SMB groups with search term', async () => {
      const mockGroups = [{ id: 1, name: 'smb-admin', smb: true } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('smb', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['smb', '=', true], ['group', '^', 'smb']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('filters built-in SMB groups when hideBuiltIn is true', async () => {
      const mockGroups = [{
        id: 1, name: 'smb-users', smb: true, builtin: false,
      } as Group];

      apiService.mockQuery('group.query', mockGroups);

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('', true, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['smb', '=', true], ['builtin', '=', false]], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('escapes backslashes in search term for domain-prefixed group names', async () => {
      apiService.mockQuery('group.query', []);

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('ACME\\Domain Admins', false, 0));

      expect(apiService.query).toHaveBeenCalledWith('group.query', [['smb', '=', true], ['group', '^', 'ACME\\\\Domain Admins']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });
  });

  describe('getGroupByName (deprecated)', () => {
    it('fetches group by name', async () => {
      const mockGroup = { gr_name: 'admin', gr_gid: 1 } as CallResponse<WebUiApiDirectory, 'group.get_group_obj'>;

      apiService.mockCall('group.get_group_obj', mockGroup);

      // eslint-disable-next-line sonarjs/deprecation
      const group = await firstValueFrom(spectator.service.getGroupByName('admin'));
      expect(apiService.call).toHaveBeenCalledWith('group.get_group_obj', [{ groupname: 'admin' }]);
      expect(group).toEqual(mockGroup);
    });
  });

  describe('getGroupByNameCached', () => {
    it('fetches group by name using cached query API', async () => {
      const mockGroup = { id: 1, name: 'admin', builtin: true } as Group;

      apiService.mockQuery('group.query', [mockGroup]);

      const group = await firstValueFrom(spectator.service.getGroupByNameCached('admin'));
      expect(apiService.queryOne).toHaveBeenCalledWith('group.query', [['name', '=', 'admin']]);
      expect(group).toEqual(mockGroup);
    });
  });

  describe('userQueryDsCache', () => {
    it('queries users without search term', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', builtin: true } as User,
        { id: 2, username: 'user1', builtin: false } as User,
      ];

      apiService.mockQuery('user.query', mockUsers);

      const users = await firstValueFrom(spectator.service.userQueryDsCache('', 0));
      expect(apiService.query).toHaveBeenCalledWith('user.query', [], { limit: 50, offset: 0, order_by: ['builtin'] });
      expect(users).toEqual(mockUsers);
    });

    it('queries users with search term', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', builtin: true } as User,
        { id: 2, username: 'administrator', builtin: false } as User,
      ];

      apiService.mockQuery('user.query', mockUsers);

      const users = await firstValueFrom(spectator.service.userQueryDsCache('admin', 0));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['username', '~', '(?i).*admin']], { limit: 50, offset: 0, order_by: ['builtin'] });
      expect(users).toEqual(mockUsers);
    });

    it('trims search input', async () => {
      const mockUser = { id: 1, username: 'admin', builtin: true } as User;

      apiService.mockQuery('user.query', [mockUser]);

      await firstValueFrom(spectator.service.userQueryDsCache('  admin  ', 0));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['username', '~', '(?i).*admin']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('handles offset parameter', async () => {
      const mockUsers = [
        { id: 1, username: 'user', builtin: false } as User,
        { id: 2, username: 'user1', builtin: false } as User,
      ];

      apiService.mockQuery('user.query', mockUsers);

      await firstValueFrom(spectator.service.userQueryDsCache('user', 50));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['username', '~', '(?i).*user']], { limit: 50, offset: 50, order_by: ['builtin'] });
    });
  });

  describe('getUserByName (deprecated)', () => {
    it('fetches user by username', async () => {
      const mockUser = { pw_name: 'admin', pw_uid: 1 } as UserObj;

      apiService.mockCall('user.get_user_obj', mockUser);

      // eslint-disable-next-line sonarjs/deprecation
      const user = await firstValueFrom(spectator.service.getUserByName('admin'));
      expect(apiService.call).toHaveBeenCalledWith('user.get_user_obj', [{ username: 'admin' }]);
      expect(user).toEqual(mockUser);
    });
  });

  describe('getUserByNameCached', () => {
    it('fetches user by username using cached query API', async () => {
      const mockUser = { id: 1, username: 'admin', builtin: true } as User;

      apiService.mockQuery('user.query', [mockUser]);

      const user = await firstValueFrom(spectator.service.getUserByNameCached('admin'));
      expect(apiService.queryOne).toHaveBeenCalledWith('user.query', [['username', '=', 'admin']]);
      expect(user).toEqual(mockUser);
    });
  });

  describe('smbUserQueryDsCache', () => {
    it('queries SMB users with empty search', async () => {
      const prefixMatchUsers = [
        { id: 1, username: 'smbuser', smb: true } as User,
        { id: 2, username: 'smbadmin', smb: true } as User,
      ];

      apiService.mockQuery('user.query', prefixMatchUsers);

      const result = await firstValueFrom(spectator.service.smbUserQueryDsCache('', 0));

      expect(result).toEqual(prefixMatchUsers);
      // Empty search: userQueryDsCacheByName returns of([]) without API call
      // Only the SMB query is made
      expect(apiService.query).toHaveBeenCalledTimes(1);
      expect(apiService.query).toHaveBeenCalledWith('user.query', [['smb', '=', true]], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('queries SMB users with search term', async () => {
      const mockUsers = [
        { id: 1, username: 'smbadmin', smb: true } as User,
        { id: 2, username: 'smbtest', smb: true } as User,
      ];

      apiService.mockQuery('user.query', mockUsers);

      const result = await firstValueFrom(spectator.service.smbUserQueryDsCache('smb', 0));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['smb', '=', true], ['username', '^', 'smb']], { limit: 50, offset: 0, order_by: ['builtin'] });
      expect(result).toEqual(mockUsers);
    });


    it('escapes backslashes in search term for domain-prefixed usernames', async () => {
      apiService.mockQuery('user.query', []);

      await firstValueFrom(spectator.service.smbUserQueryDsCache('ACME\\admin', 0));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['smb', '=', true], ['username', '^', 'ACME\\\\admin']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });

    it('trims search input', async () => {
      apiService.mockQuery('user.query', []);

      await firstValueFrom(spectator.service.smbUserQueryDsCache('  smbuser  ', 0));

      expect(apiService.query).toHaveBeenCalledWith('user.query', [['smb', '=', true], ['username', '^', 'smbuser']], { limit: 50, offset: 0, order_by: ['builtin'] });
    });
  });

  describe('namePattern', () => {
    it('matches valid usernames', () => {
      expect(UserService.namePattern.test('user1')).toBe(true);
      expect(UserService.namePattern.test('user_name')).toBe(true);
      expect(UserService.namePattern.test('user.name')).toBe(true);
      expect(UserService.namePattern.test('user-name')).toBe(true);
      expect(UserService.namePattern.test('USER123')).toBe(true);
      expect(UserService.namePattern.test('user$')).toBe(true);
    });

    it('rejects invalid usernames', () => {
      expect(UserService.namePattern.test('-user')).toBe(false);
      expect(UserService.namePattern.test('.user')).toBe(false);
      expect(UserService.namePattern.test('user name')).toBe(false);
      expect(UserService.namePattern.test('user@name')).toBe(false);
      expect(UserService.namePattern.test('$$user')).toBe(false);
    });
  });
});
