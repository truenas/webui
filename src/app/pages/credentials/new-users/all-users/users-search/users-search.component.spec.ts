import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { DirectoryServicesState } from 'app/interfaces/directory-services-state.interface';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/forms/search-input/components/search-input/search-input.harness';
import { AdvancedSearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { mockUserApiDataProvider } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import * as UsersSearchPresets from 'app/pages/credentials/new-users/all-users/users-search/users-search-presets';
import { UsersSearchComponent } from 'app/pages/credentials/new-users/all-users/users-search/users-search.component';

enum UserType {
  Builtin = 'builtin',
  Local = 'local',
  Directory = 'directory',
}

describe('UsersSearchComponent', () => {
  let spectator: Spectator<UsersSearchComponent>;
  let loader: HarnessLoader;
  let component: UsersSearchComponent;
  let mockDataProvider: jest.Mocked<ApiDataProvider<'user.query'>>;

  const createComponent = createComponentFactory({
    component: UsersSearchComponent,
    imports: [
      SearchInputComponent,
    ],
    providers: [
      mockApi([
        mockCall('directoryservices.get_state', {
          activedirectory: DirectoryServiceState.Healthy,
          ldap: DirectoryServiceState.Disabled,
        } as DirectoryServicesState),
      ]),
    ],
  });

  beforeEach(() => {
    mockDataProvider = {
      ...mockUserApiDataProvider,
      currentPage$: new BehaviorSubject([
        {
          id: 1, username: 'root', builtin: true, local: false,
        } as User,
        {
          id: 2, username: 'user1', builtin: false, local: true,
        } as User,
        {
          id: 3, username: 'aduser', builtin: false, local: false,
        } as User,
      ]),
    } as unknown as jest.Mocked<ApiDataProvider<'user.query'>>;

    spectator = createComponent({
      props: {
        dataProvider: mockDataProvider,
      },
    });
    component = spectator.component;
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('Basic Search', () => {
    it('performs search with the correct value', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('root');
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          [
            'OR',
            [
              ['username', '~', '(?i)root'],
              ['full_name', '~', '(?i)root'],
            ],
          ],
        ],
        {},
      ]);
    });

    it('searches with user type filters', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);

      // Select builtin user type
      (component as unknown as { onUserTypeChange: (types: UserType[]) => void })
        .onUserTypeChange([UserType.Builtin]);
      await searchInput.setValue('test');

      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [
          [
            'OR',
            [
              [
                'username',
                '~',
                '(?i)test',
              ],
              [
                [
                  'full_name',
                  '~',
                  '(?i)test',
                ],
                [
                  'builtin',
                  '=',
                  true,
                ],
              ],
            ],
          ],
        ],
        {},
      ]);
    });
  });

  describe('Advanced Search', () => {
    it('performs advanced search with builtin filter', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);
      await advancedModeHarness.setValue('"Built in" = false');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([[['builtin', '=', false]]]);
      expect(mockDataProvider.load).toHaveBeenCalled();
    });

    it('updates builtin filter state correctly', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Apply builtin filter
      await advancedModeHarness.setValue('"Built in" = true');
      spectator.detectChanges();

      // Component should track the builtin filter state
      expect((component as unknown as { isBuiltinFilterActive: () => boolean }).isBuiltinFilterActive()).toBe(true);
    });
  });

  describe('Active Directory Integration', () => {
    it('shows Directory Services option when AD is enabled', () => {
      const userTypeOptions = (component as unknown as { userTypeOptionsSignal: () => unknown[] })
        .userTypeOptionsSignal();
      expect(userTypeOptions).toContainEqual(
        expect.objectContaining({ label: 'Directory Services', value: 'directory' }),
      );
    });

    it('generates correct presets when AD is enabled', () => {
      const presets = (component as unknown as { userPresets: () => { label: string }[] }).userPresets();
      const adPreset = presets.find((preset) => preset.label.includes('Active Directory'));
      expect(adPreset).toBeDefined();
    });

    it('updates AD filter state when local filter is applied', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Apply local filter (hide AD users)
      await advancedModeHarness.setValue('"Local" = true');
      spectator.detectChanges();

      expect(
        (component as unknown as { isActiveDirectoryFilterActive: () => boolean }).isActiveDirectoryFilterActive(),
      ).toBe(true);
    });

    it('filters by directory users correctly', () => {
      (component as unknown as { onUserTypeChange: (types: UserType[]) => void })
        .onUserTypeChange([UserType.Directory]);

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['local', '=', false],
          ['builtin', '=', false],
        ],
        {},
      ]);
    });
  });

  describe('Active Directory Disabled', () => {
    const createComponentWithDisabledAd = createComponentFactory({
      component: UsersSearchComponent,
      imports: [SearchInputComponent],
      providers: [
        mockApi([
          mockCall('directoryservices.get_state', {
            activedirectory: DirectoryServiceState.Disabled,
            ldap: DirectoryServiceState.Disabled,
          } as DirectoryServicesState),
        ]),
      ],
    });

    beforeEach(() => {
      spectator = createComponentWithDisabledAd({
        props: {
          dataProvider: mockDataProvider,
        },
      });
      component = spectator.component;
    });

    it('does not show Directory Services option when AD is disabled', () => {
      const userTypeOptions = (component as unknown as { userTypeOptionsSignal: () => unknown[] })
        .userTypeOptionsSignal();
      expect(userTypeOptions).not.toContainEqual(
        expect.objectContaining({ value: 'directory' }),
      );
    });

    it('does not include Active Directory preset when AD is disabled', () => {
      const presets = (component as unknown as { userPresets: () => { label: string }[] }).userPresets();
      const adPreset = presets.find((preset) => preset.label.includes('Active Directory'));
      expect(adPreset).toBeUndefined();
    });
  });

  describe('Filter Conflict Resolution', () => {
    it('resolves conflicting builtin filters by keeping the latest', () => {
      const mockQuery: AdvancedSearchQuery<User> = {
        isBasicQuery: false,
        filters: [
          ['builtin', '=', true],
          ['username', '~', 'test'],
          ['builtin', '=', false], // Conflicting filter
        ],
      };

      const result = (component as unknown as {
        removeConflictingFilters: (query: AdvancedSearchQuery<User>) => AdvancedSearchQuery<User>;
      }).removeConflictingFilters(mockQuery);

      expect(result.filters).toEqual([
        ['username', '~', 'test'],
        ['builtin', '=', false], // Latest builtin filter kept
      ]);
    });

    it('resolves conflicting local filters by keeping the latest', () => {
      const mockQuery: AdvancedSearchQuery<User> = {
        isBasicQuery: false,
        filters: [
          ['local', '=', false],
          ['username', '~', 'test'],
          ['local', '=', true], // Conflicting filter
        ],
      };

      const result = (component as unknown as {
        removeConflictingFilters: (query: AdvancedSearchQuery<User>) => AdvancedSearchQuery<User>;
      }).removeConflictingFilters(mockQuery);

      expect(result.filters).toEqual([
        ['username', '~', 'test'],
        ['local', '=', true], // Latest local filter kept
      ]);
    });

    it('handles multiple filter types without conflicts', () => {
      const mockQuery: AdvancedSearchQuery<User> = {
        isBasicQuery: false,
        filters: [
          ['builtin', '=', true],
          ['local', '=', false],
          ['username', '~', 'test'],
        ],
      };

      const result = (component as unknown as {
        removeConflictingFilters: (query: AdvancedSearchQuery<User>) => AdvancedSearchQuery<User>;
      }).removeConflictingFilters(mockQuery);

      expect(result.filters).toEqual([
        ['username', '~', 'test'],
        ['builtin', '=', true],
        ['local', '=', false],
      ]);
    });
  });

  describe('Search Properties', () => {
    it('generates correct search properties from user data', () => {
      const users = [
        {
          id: 1,
          username: 'root',
          full_name: 'Root User',
          email: 'root@test.com',
          builtin: true,
          local: false,
          group: { id: 1 },
          groups: [1, 2],
          roles: ['READONLY_ADMIN'],
        } as User,
      ];

      (component as unknown as { setSearchProperties: (users: User[]) => void }).setSearchProperties(users);
      const properties = (component as unknown as { searchProperties: () => { property: string; label: string }[] })
        .searchProperties();

      expect(properties).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ property: 'id', label: 'ID' }),
          expect.objectContaining({ property: 'username', label: 'Username' }),
          expect.objectContaining({ property: 'fullname', label: 'Full Name' }),
          expect.objectContaining({ property: 'email', label: 'Email' }),
          expect.objectContaining({ property: 'builtin', label: 'Built in' }),
          expect.objectContaining({ property: 'local', label: 'Local' }),
        ]),
      );
    });
  });

  describe('Default Presets', () => {
    it('includes default presets', () => {
      const presets = (component as unknown as { userPresets: () => { label: string }[] }).userPresets();
      const presetLabels = presets.map((preset) => preset.label);
      expect(presetLabels).toContain('Has API Access');
      expect(presetLabels).toContain('Has SMB Access');
      expect(presetLabels).toContain('Has Shell Access');
      expect(presetLabels).toContain('Has SSH Access');
    });
  });

  describe('Helper Functions', () => {
    it('getDefaultPresets returns correct presets', () => {
      const presets = UsersSearchPresets.getDefaultPresets();
      expect(presets).toHaveLength(4);
      expect(presets).toEqual([
        { label: 'Has API Access', query: [['api_keys', '!=', null]] },
        { label: 'Has SMB Access', query: [['smb', '=', true]] },
        { label: 'Has Shell Access', query: [['shell', '!=', null]] },
        { label: 'Has SSH Access', query: [['sshpubkey', '!=', null]] },
      ]);
    });

    it('getBuiltinTogglePreset returns correct preset for inactive state', () => {
      const preset = UsersSearchPresets.getBuiltinTogglePreset(false);
      expect(preset).toEqual({
        label: 'Show Built-in Users',
        query: [['builtin', '=', true]],
      });
    });

    it('getBuiltinTogglePreset returns correct preset for active state', () => {
      const preset = UsersSearchPresets.getBuiltinTogglePreset(true);
      expect(preset).toEqual({
        label: 'Hide Built-in Users',
        query: [['builtin', '=', false]],
      });
    });

    it('getActiveDirectoryTogglePreset returns correct preset for inactive state', () => {
      const preset = UsersSearchPresets.getActiveDirectoryTogglePreset(false);
      expect(preset).toEqual({
        label: 'Hide Active Directory',
        query: [['local', '=', true]],
      });
    });

    it('getActiveDirectoryTogglePreset returns correct preset for active state', () => {
      const preset = UsersSearchPresets.getActiveDirectoryTogglePreset(true);
      expect(preset).toEqual({
        label: 'Show Active Directory',
        query: [['local', '=', false]],
      });
    });
  });
});
