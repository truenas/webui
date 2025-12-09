import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { firstValueFrom, of } from 'rxjs';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';

describe('UserService', () => {
  let spectator: SpectatorService<UserService>;
  let apiService: ApiService;

  const createService = createServiceFactory({
    service: UserService,
    providers: [
      mockProvider(ApiService),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    apiService = spectator.inject(ApiService);
  });

  describe('groupQueryDsCache', () => {
    it('queries groups without search term', async () => {
      const mockGroups = [
        { id: 1, name: 'admin', builtin: true } as Group,
        { id: 2, name: 'users', builtin: false } as Group,
      ];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      const groups = await firstValueFrom(spectator.service.groupQueryDsCache('', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
      expect(groups).toEqual(mockGroups);
    });

    it('queries groups with search term', async () => {
      const mockGroups = [{ id: 1, name: 'admin', builtin: true } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.groupQueryDsCache('admin', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['group', '~', '(?i).*admin']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('filters out built-in groups when hideBuiltIn is true', async () => {
      const mockGroups = [{ id: 1, name: 'users', builtin: false } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.groupQueryDsCache('', true, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['builtin', '=', false]],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('trims search input', async () => {
      const mockGroups = [{ id: 1, name: 'admin', builtin: true } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.groupQueryDsCache('  admin  ', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['group', '~', '(?i).*admin']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('deduplicates groups from name search and regular search', async () => {
      const groupByName = [{ id: 1, name: 'admin', builtin: true } as Group];
      const groupsFromQuery = [
        { id: 1, name: 'admin', builtin: true } as Group,
        { id: 2, name: 'administrators', builtin: false } as Group,
      ];

      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(of(groupByName))
        .mockReturnValueOnce(of(groupsFromQuery));

      const groups = await firstValueFrom(spectator.service.groupQueryDsCache('admin', false, 0));
      expect(groups).toHaveLength(2);
      expect(groups).toEqual([
        { id: 2, name: 'administrators', builtin: false },
        { id: 1, name: 'admin', builtin: true },
      ]);
    });

    it('escapes backslashes in search term', async () => {
      const mockGroups = [] as Group[];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.groupQueryDsCache('test\\path', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['group', '~', '(?i).*test\\\\path']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });
  });

  describe('smbGroupQueryDsCache', () => {
    it('queries SMB groups only', async () => {
      const mockGroups = [{ id: 1, name: 'smb-group', smb: true } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['smb', '=', true]],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('queries SMB groups with search term', async () => {
      const mockGroups = [{ id: 1, name: 'smb-admin', smb: true } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('smb', false, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['smb', '=', true], ['group', '^', 'smb']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('filters built-in SMB groups when hideBuiltIn is true', async () => {
      const mockGroups = [{
        id: 1, name: 'smb-users', smb: true, builtin: false,
      } as Group];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroups));

      await firstValueFrom(spectator.service.smbGroupQueryDsCache('', true, 0));

      expect(apiService.call).toHaveBeenCalledWith('group.query', [
        [['smb', '=', true], ['builtin', '=', false]],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });
  });

  describe('getGroupByName', () => {
    it('fetches group by name', async () => {
      const mockGroup = { gr_name: 'admin', gr_gid: 1 };

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockGroup));

      const group = await firstValueFrom(spectator.service.getGroupByName('admin'));
      expect(apiService.call).toHaveBeenCalledWith('group.get_group_obj', [{ groupname: 'admin' }]);
      expect(group).toEqual(mockGroup);
    });
  });

  describe('userQueryDsCache', () => {
    it('queries users without search term', async () => {
      const mockUsers = [
        { id: 1, username: 'admin', builtin: true } as User,
        { id: 2, username: 'user1', builtin: false } as User,
      ];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockUsers));

      const users = await firstValueFrom(spectator.service.userQueryDsCache('', 0));
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
      expect(users).toEqual(mockUsers);
    });

    it('queries users with search term', async () => {
      const mockUser = { id: 1, username: 'admin', builtin: true } as User;
      const mockUsers = [{ id: 2, username: 'administrator', builtin: false } as User];

      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(of([mockUser])) // Exact name match
        .mockReturnValueOnce(of(mockUsers)); // Regex search

      const users = await firstValueFrom(spectator.service.userQueryDsCache('admin', 0));

      // Should call exact name match first
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '=', 'admin']],
        { limit: 50 },
      ]);

      // Then regex search
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '~', '(?i).*admin']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);

      // Should return deduplicated results with exact match prioritized
      expect(users).toEqual([mockUsers[0], mockUser]);
    });

    it('trims search input', async () => {
      const mockUser = { id: 1, username: 'admin', builtin: true } as User;

      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(of([mockUser])) // Exact name match
        .mockReturnValueOnce(of([])); // Regex search

      await firstValueFrom(spectator.service.userQueryDsCache('  admin  ', 0));

      // Should trim and call exact name match
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '=', 'admin']],
        { limit: 50 },
      ]);

      // Then regex search with trimmed value
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '~', '(?i).*admin']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('handles offset parameter', async () => {
      const mockUser = { id: 1, username: 'user', builtin: false } as User;
      const mockUsers = [{ id: 2, username: 'user1', builtin: false } as User];

      jest.spyOn(apiService, 'call')
        .mockReturnValueOnce(of([mockUser])) // Exact name match
        .mockReturnValueOnce(of(mockUsers)); // Regex search with offset

      await firstValueFrom(spectator.service.userQueryDsCache('user', 50));

      // Should call exact name match
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '=', 'user']],
        { limit: 50 },
      ]);

      // Then regex search with offset
      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['username', '~', '(?i).*user']],
        { limit: 50, offset: 50, order_by: ['builtin'] },
      ]);
    });
  });

  describe('getUserByName', () => {
    it('fetches user by username', async () => {
      const mockUser = { pw_name: 'admin', pw_uid: 1 };

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockUser));

      const user = await firstValueFrom(spectator.service.getUserByName('admin'));
      expect(apiService.call).toHaveBeenCalledWith('user.get_user_obj', [{ username: 'admin' }]);
      expect(user).toEqual(mockUser);
    });
  });

  describe('smbUserQueryDsCache', () => {
    it('queries SMB users only', async () => {
      const mockUsers = [{ id: 1, username: 'smbuser', smb: true } as User];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockUsers));

      await firstValueFrom(spectator.service.smbUserQueryDsCache('', 0));

      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['smb', '=', true]],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('queries SMB users with search term', async () => {
      const mockUsers = [{ id: 1, username: 'smbadmin', smb: true } as User];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockUsers));

      await firstValueFrom(spectator.service.smbUserQueryDsCache('smb', 0));

      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['smb', '=', true], ['username', '^', 'smb']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
    });

    it('trims search input', async () => {
      const mockUsers = [{ id: 1, username: 'smbuser', smb: true } as User];

      jest.spyOn(apiService, 'call').mockReturnValue(of(mockUsers));

      await firstValueFrom(spectator.service.smbUserQueryDsCache('  smbuser  ', 0));

      expect(apiService.call).toHaveBeenCalledWith('user.query', [
        [['smb', '=', true], ['username', '^', 'smbuser']],
        { limit: 50, offset: 0, order_by: ['builtin'] },
      ]);
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
