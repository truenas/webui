import { lastValueFrom, of } from 'rxjs';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Group } from 'app/interfaces/group.interface';
import { UserService } from 'app/services/user.service';
import { GroupComboboxProvider } from './group-combobox-provider';

describe('GroupComboboxProvider', () => {
  let userService: UserService;
  let provider: GroupComboboxProvider;

  const mockGroups: Group[] = [
    { group: 'group1', gid: 1000, id: 1 } as Group,
    { group: 'group2', gid: 1001, id: 2 } as Group,
  ];

  beforeEach(() => {
    userService = {
      groupQueryDsCache: jest.fn().mockReturnValue(of(mockGroups)),
      smbGroupQueryDsCache: jest.fn().mockReturnValue(of(mockGroups)),
    } as unknown as UserService;
  });

  describe('basic functionality', () => {
    beforeEach(() => {
      provider = new GroupComboboxProvider(userService);
    });

    it('returns groups as options with group name as value by default', async () => {
      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'group1', value: 'group1' },
        { label: 'group2', value: 'group2' },
      ]);
      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('test', false, 0, []);
    });

    it('supports custom value field', async () => {
      provider = new GroupComboboxProvider(userService, { valueField: 'gid' });

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'group1', value: 1000 },
        { label: 'group2', value: 1001 },
      ]);
    });

    it('handles pagination correctly', async () => {
      await lastValueFrom(provider.nextPage('test'));

      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('test', false, 50, []);
    });

    it('resets page on fetch', async () => {
      await lastValueFrom(provider.nextPage('test'));
      await lastValueFrom(provider.fetch('test'));

      expect(userService.groupQueryDsCache).toHaveBeenLastCalledWith('test', false, 0, []);
    });
  });

  describe('localOnly option', () => {
    it('passes local and immutable filters when localOnly is true', async () => {
      provider = new GroupComboboxProvider(userService, { localOnly: true });

      await lastValueFrom(provider.fetch('test'));

      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('test', false, 0, [
        ['local', '=', true],
        ['immutable', '=', false],
      ]);
    });
  });

  describe('SMB query type', () => {
    beforeEach(() => {
      provider = new GroupComboboxProvider(userService, { queryType: ComboboxQueryType.Smb });
    });

    it('uses smbGroupQueryDsCache when query type is Smb', async () => {
      await lastValueFrom(provider.fetch('test'));

      expect(userService.smbGroupQueryDsCache).toHaveBeenCalledWith('test', false, 0);
      expect(userService.groupQueryDsCache).not.toHaveBeenCalled();
    });

    it('does not apply localOnly filter for SMB queries', async () => {
      provider = new GroupComboboxProvider(userService, {
        queryType: ComboboxQueryType.Smb,
        localOnly: true,
      });

      await lastValueFrom(provider.fetch('test'));

      expect(userService.smbGroupQueryDsCache).toHaveBeenCalledWith('test', false, 0);
      expect(userService.groupQueryDsCache).not.toHaveBeenCalled();
    });
  });

  describe('excludedIds option', () => {
    it('filters out groups with excluded ids', async () => {
      provider = new GroupComboboxProvider(userService, { excludedIds: [1] });

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'group2', value: 'group2' },
      ]);
    });

    it('returns all groups when excludedIds is empty', async () => {
      provider = new GroupComboboxProvider(userService, { excludedIds: [] });

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'group1', value: 'group1' },
        { label: 'group2', value: 'group2' },
      ]);
    });
  });

  describe('initialOptions feature', () => {
    const initialOptions = [
      { label: 'nogroup', value: 'nogroup' },
    ];

    beforeEach(() => {
      provider = new GroupComboboxProvider(userService, { initialOptions });
    });

    it('includes initial options in results', async () => {
      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'nogroup', value: 'nogroup' },
        { label: 'group1', value: 'group1' },
        { label: 'group2', value: 'group2' },
      ]);
    });

    it('excludes duplicate initial options from query results', async () => {
      jest.spyOn(userService, 'groupQueryDsCache').mockReturnValue(of([
        { group: 'nogroup', gid: 65534, id: 999 } as Group,
        { group: 'group1', gid: 1000, id: 1 } as Group,
      ]));

      const options = await lastValueFrom(provider.fetch('test'));

      expect(options).toEqual([
        { label: 'nogroup', value: 'nogroup' },
        { label: 'group1', value: 'group1' },
      ]);
    });
  });
});
