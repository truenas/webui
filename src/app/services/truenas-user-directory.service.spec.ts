import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { lastValueFrom, of, throwError } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ComboboxQueryType } from 'app/enums/combobox.enum';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { TrueNasUserDirectory } from 'app/services/truenas-user-directory.service';
import { UserService } from 'app/services/user.service';

/**
 * The seam between the library's `tn-user-*` / `tn-group-*` fields and TrueNAS.
 *
 * Everything here used to be spread across five webui wrapper components and
 * their providers, so these cases are the surviving product behaviour from all
 * of them: which endpoint answers a lookup, how a field's `directoryOptions`
 * narrow it, which record field becomes the value, and how existence checks use
 * the caches.
 */
describe('TrueNasUserDirectory', () => {
  let spectator: SpectatorService<TrueNasUserDirectory>;
  let directory: TrueNasUserDirectory;
  let userService: UserService;

  const createService = createServiceFactory({
    service: TrueNasUserDirectory,
    providers: [
      mockApi([mockCall('user.query', [])]),
      mockProvider(FormSidePanelService),
      mockProvider(UserService, {
        userQueryDsCache: jest.fn(() => of([{ username: 'root', uid: 0, id: 1 }] as User[])),
        smbUserQueryDsCache: jest.fn(() => of([{ username: 'smbuser', uid: 3000, id: 5 }] as User[])),
        groupQueryDsCache: jest.fn(() => of([{ group: 'wheel', gid: 0, id: 2 }] as Group[])),
        smbGroupQueryDsCache: jest.fn(() => of([{ group: 'smbgroup', gid: 3000, id: 6 }] as Group[])),
        isUserInAutocompleteCache: jest.fn(() => false),
        isUserCachedAsNonExistent: jest.fn(() => false),
        isGroupInAutocompleteCache: jest.fn(() => false),
        isGroupCachedAsNonExistent: jest.fn(() => false),
        getUserByNameCached: jest.fn(() => of({ username: 'root' } as User)),
        getGroupByNameCached: jest.fn(() => of({ group: 'wheel' } as Group)),
        recordUserAsNonExistent: jest.fn(),
        recordGroupAsNonExistent: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    directory = spectator.service;
    userService = spectator.inject(UserService);

    // `mockProvider`'s stubs are built once when the factory is defined, so a
    // `spyOn` in one case would otherwise still be in place for the next.
    jest.restoreAllMocks();
    jest.spyOn(userService, 'isUserInAutocompleteCache').mockReturnValue(false);
    jest.spyOn(userService, 'isUserCachedAsNonExistent').mockReturnValue(false);
    jest.spyOn(userService, 'isGroupInAutocompleteCache').mockReturnValue(false);
    jest.spyOn(userService, 'isGroupCachedAsNonExistent').mockReturnValue(false);
  });

  describe('queryUsers', () => {
    it('searches the cached user query, paging by the reported page size', async () => {
      await lastValueFrom(directory.queryUsers('ro', 2, {}));

      expect(userService.userQueryDsCache).toHaveBeenCalledWith('ro', 100);
    });

    it('commits the username by default', async () => {
      const options = await lastValueFrom(directory.queryUsers('', 0, {}));

      expect(options).toEqual([{ label: 'root', value: 'root' }]);
    });

    it('commits the field named by valueField instead', async () => {
      const options = await lastValueFrom(directory.queryUsers('', 0, { valueField: 'uid' }));

      expect(options).toEqual([{ label: 'root', value: 0 }]);
    });

    it('uses the SMB query when the field asks for it', async () => {
      await lastValueFrom(directory.queryUsers('x', 0, { queryType: ComboboxQueryType.Smb }));

      expect(userService.smbUserQueryDsCache).toHaveBeenCalledWith('x', 0);
      expect(userService.userQueryDsCache).not.toHaveBeenCalled();
    });

    describe('with queryParams', () => {
      // A field with its own filters cannot go through UserService, whose
      // autocomplete cache takes none.
      it('queries the endpoint directly, merging the field filters with the search', async () => {
        const api = spectator.inject(ApiService);

        await lastValueFrom(directory.queryUsers('ad', 1, {
          queryParams: [[['roles', '!=', []]], { select: ['username'] }],
        }));

        expect(userService.userQueryDsCache).not.toHaveBeenCalled();
        expect(api.call).toHaveBeenCalledWith('user.query', [
          [['username', '~', '(?i).*ad'], ['roles', '!=', []]],
          { select: ['username'], offset: 50, limit: 50 },
        ]);
      });

      it('escapes backslashes so a domain-prefixed name is searchable verbatim', async () => {
        const api = spectator.inject(ApiService);

        await lastValueFrom(directory.queryUsers('ACME\\adm', 0, { queryParams: [[], {}] }));

        expect(api.call).toHaveBeenCalledWith('user.query', [
          [['username', '~', '(?i).*ACME\\\\adm']],
          { offset: 0, limit: 50 },
        ]);
      });

      it('does not add a search filter for a blank query', async () => {
        const api = spectator.inject(ApiService);

        await lastValueFrom(directory.queryUsers('   ', 0, { queryParams: [[], {}] }));

        expect(api.call).toHaveBeenCalledWith('user.query', [[], { offset: 0, limit: 50 }]);
      });
    });
  });

  describe('queryGroups', () => {
    it('applies no filters by default', async () => {
      await lastValueFrom(directory.queryGroups('wh', 0, {}));

      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('wh', false, 0, []);
    });

    it('restricts to local groups without excluding built-ins', async () => {
      await lastValueFrom(directory.queryGroups('', 0, { localOnly: true }));

      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('', false, 0, [['local', '=', true]]);
    });

    it('excludes built-ins only when the field asks for mutable groups', async () => {
      await lastValueFrom(directory.queryGroups('', 0, { localOnly: true, mutableOnly: true }));

      expect(userService.groupQueryDsCache).toHaveBeenCalledWith('', false, 0, [
        ['local', '=', true],
        ['immutable', '=', false],
      ]);
    });

    it('drops excluded ids from the page', async () => {
      const options = await lastValueFrom(directory.queryGroups('', 0, { excludedIds: [2] }));

      expect(options).toEqual([]);
    });

    it('uses the SMB query, which is not narrowed to local groups', async () => {
      await lastValueFrom(directory.queryGroups('x', 0, {
        queryType: ComboboxQueryType.Smb,
        localOnly: true,
      }));

      expect(userService.smbGroupQueryDsCache).toHaveBeenCalledWith('x', false, 0);
      expect(userService.groupQueryDsCache).not.toHaveBeenCalled();
    });
  });

  describe('userExists', () => {
    it('answers from the autocomplete cache without a lookup', async () => {
      jest.spyOn(userService, 'isUserInAutocompleteCache').mockReturnValue(true);

      expect(await lastValueFrom(directory.userExists('root'))).toBe(true);
      expect(userService.getUserByNameCached).not.toHaveBeenCalled();
    });

    it('answers from the negative cache without a lookup', async () => {
      jest.spyOn(userService, 'isUserCachedAsNonExistent').mockReturnValue(true);

      expect(await lastValueFrom(directory.userExists('ghost'))).toBe(false);
      expect(userService.getUserByNameCached).not.toHaveBeenCalled();
    });

    it('records a failed lookup so the same name is not queried again', async () => {
      jest.spyOn(userService, 'getUserByNameCached')
        .mockReturnValue(throwError(() => new Error('not found')));

      expect(await lastValueFrom(directory.userExists('ghost'))).toBe(false);
      expect(userService.recordUserAsNonExistent).toHaveBeenCalledWith('ghost');
    });
  });

  describe('groupExists', () => {
    it('records a failed lookup so the same name is not queried again', async () => {
      jest.spyOn(userService, 'getGroupByNameCached')
        .mockReturnValue(throwError(() => new Error('not found')));

      expect(await lastValueFrom(directory.groupExists('ghost'))).toBe(false);
      expect(userService.recordGroupAsNonExistent).toHaveBeenCalledWith('ghost');
    });
  });
});
