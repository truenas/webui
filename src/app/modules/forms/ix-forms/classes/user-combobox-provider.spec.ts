import { lastValueFrom, of } from 'rxjs';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { User } from 'app/interfaces/user.interface';
import { UserService } from 'app/services/user.service';
import { UserComboboxProvider } from './user-combobox-provider';

describe('UserComboboxProvider', () => {
  let userService: UserService;
  let provider: UserComboboxProvider;

  const mockUsers: User[] = [
    { username: 'user1', uid: 1000, id: 1 } as User,
    { username: 'user2', uid: 1001, id: 2 } as User,
    { username: 'user3', uid: 1002, id: 3 } as User,
  ];

  beforeEach(() => {
    userService = {
      userQueryDsCache: jest.fn().mockReturnValue(of(mockUsers)),
      smbUserQueryDsCache: jest.fn().mockReturnValue(of(mockUsers)),
    } as unknown as UserService;
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      provider = new UserComboboxProvider(userService);
    });

    it('returns users as options with username as value by default', async () => {
      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'user1', value: 'user1' },
        { label: 'user2', value: 'user2' },
        { label: 'user3', value: 'user3' },
      ]);
      expect(userService.userQueryDsCache).toHaveBeenCalledWith('test', 0);
    });

    it('supports custom value field', async () => {
      provider = new UserComboboxProvider(userService, { valueField: 'uid' });

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'user1', value: 1000 },
        { label: 'user2', value: 1001 },
        { label: 'user3', value: 1002 },
      ]);
    });

    it('handles pagination correctly', async () => {
      await lastValueFrom(provider.nextPage('test'));

      expect(userService.userQueryDsCache).toHaveBeenCalledWith('test', 50);
    });

    it('resets page on fetch', async () => {
      // First call nextPage to increment page
      await lastValueFrom(provider.nextPage('test'));

      // Then fetch should reset page to 0
      await lastValueFrom(provider.fetch('test'));

      expect(userService.userQueryDsCache).toHaveBeenLastCalledWith('test', 0);
    });
  });

  describe('SMB query type', () => {
    beforeEach(() => {
      provider = new UserComboboxProvider(userService, { queryType: ComboboxQueryType.Smb });
    });

    it('uses smbUserQueryDsCache when query type is Smb', async () => {
      await lastValueFrom(provider.fetch('test'));

      expect(userService.smbUserQueryDsCache).toHaveBeenCalledWith('test', 0);
      expect(userService.userQueryDsCache).not.toHaveBeenCalled();
    });
  });

  describe('initialOptions feature', () => {
    const initialOptions = [
      { label: 'nobody', value: 'nobody' },
      { label: 'admin', value: 'admin' },
    ];

    beforeEach(() => {
      provider = new UserComboboxProvider(userService, { initialOptions });
    });

    it('includes initial options in results', async () => {
      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'nobody', value: 'nobody' },
        { label: 'admin', value: 'admin' },
        { label: 'user1', value: 'user1' },
        { label: 'user2', value: 'user2' },
        { label: 'user3', value: 'user3' },
      ]);
    });

    it('excludes duplicate initial options from query results', async () => {
      const mockUsersWithDuplicate: User[] = [
        { username: 'nobody', uid: 65534, id: 999 } as User, // Duplicate
        { username: 'user1', uid: 1000, id: 1 } as User,
      ];
      jest.spyOn(userService, 'userQueryDsCache').mockReturnValue(of(mockUsersWithDuplicate));

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'nobody', value: 'nobody' }, // From initialOptions
        { label: 'admin', value: 'admin' }, // From initialOptions
        { label: 'user1', value: 'user1' }, // From query (nobody excluded as duplicate)
      ]);
    });

    it('works correctly with pagination', async () => {
      const mockPage2Users: User[] = [
        { username: 'user4', uid: 1003, id: 4 } as User,
        { username: 'admin', uid: 0, id: 0 } as User, // Duplicate of initial option
      ];
      jest.spyOn(userService, 'userQueryDsCache').mockReturnValue(of(mockPage2Users));

      const options = await lastValueFrom(provider.nextPage('test'));

      expect(options).toEqual([
        { label: 'nobody', value: 'nobody' }, // From initialOptions
        { label: 'admin', value: 'admin' }, // From initialOptions
        { label: 'user4', value: 'user4' }, // From query (admin excluded as duplicate)
      ]);
    });

    it('works with custom value field', async () => {
      const initialOptionsWithUid = [
        { label: 'nobody', value: 65534 },
      ];
      provider = new UserComboboxProvider(userService, {
        valueField: 'uid',
        initialOptions: initialOptionsWithUid,
      });

      const mockUsersWithDuplicate: User[] = [
        { username: 'nobody', uid: 65534, id: 999 } as User, // Duplicate by uid
        { username: 'user1', uid: 1000, id: 1 } as User,
      ];
      jest.spyOn(userService, 'userQueryDsCache').mockReturnValue(of(mockUsersWithDuplicate));

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'nobody', value: 65534 }, // From initialOptions
        { label: 'user1', value: 1000 }, // From query (nobody excluded by uid match)
      ]);
    });
  });
});
