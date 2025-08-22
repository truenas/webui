import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/forms/search-input/components/search-input/search-input.harness';
import { AdvancedSearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { mockUserApiDataProvider } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UsersDataProvider } from 'app/pages/credentials/new-users/all-users/users-data-provider';
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
  let mockDataProvider: jest.Mocked<UsersDataProvider>;

  const createComponent = createComponentFactory({
    component: UsersSearchComponent,
    imports: [
      SearchInputComponent,
    ],
    providers: [
      mockApi([
        mockCall('directoryservices.status', {
          status: DirectoryServiceStatus.Healthy,
          type: null,
          status_msg: null,
        } as DirectoryServicesStatus),
      ]),
    ],
  });

  beforeEach(() => {
    mockDataProvider = {
      ...mockUserApiDataProvider,
      currentPage$: new BehaviorSubject([
        {
          id: 1, username: 'root', builtin: true, local: false, full_name: 'Root User',
        } as User,
        {
          id: 2, username: 'localuser1', builtin: false, local: true, full_name: 'Local User 1',
        } as User,
        {
          id: 3, username: 'localuser2', builtin: false, local: true, full_name: 'Local User 2',
        } as User,
        {
          id: 4, username: 'daemon', builtin: true, local: false, full_name: 'Daemon User',
        } as User,
        {
          id: 5, username: 'www', builtin: true, local: false, full_name: 'Web Server User',
        } as User,
        {
          id: 6, username: 'aduser1', builtin: false, local: false, full_name: 'AD User 1',
        } as User,
        {
          id: 7, username: 'aduser2', builtin: false, local: false, full_name: 'AD User 2',
        } as User,
      ]),
      additionalUsername: '',
      shouldLoadUser: jest.fn(),
    } as unknown as jest.Mocked<UsersDataProvider>;

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
              [
                'username',
                '~',
                '(?i)root',
              ],
              [
                [
                  'full_name',
                  '~',
                  '(?i)root',
                ],
                [
                  'OR',
                  [
                    [
                      [
                        'local',
                        '=',
                        true,
                      ],
                      [
                        'builtin',
                        '=',
                        false,
                      ],
                    ],
                    [
                      'username',
                      '=',
                      'root',
                    ],
                  ],
                ],
              ],
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
          mockCall('directoryservices.status', {
            status: DirectoryServiceStatus.Disabled,
            type: null,
            status_msg: null,
          } as DirectoryServicesStatus),
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

  describe('Search Mode Switching - Default States', () => {
    it('shows default local users on page load, switches to all users in Advanced, then back to local users in Basic', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);

      // Verify component starts in Basic mode
      expect(await searchInput.isInAdvancedMode()).toBe(false);

      // Component doesn't call setParams on initialization in test, so trigger user type change
      (component as unknown as { onUserTypeChange: (types: string[]) => void })
        .onUserTypeChange(['local']);

      // Verify initial Basic mode applies local user filtering
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          [
            'OR',
            [
              [
                ['local', '=', true],
                ['builtin', '=', false],
              ],
              ['username', '=', 'root'],
            ],
          ],
        ],
        {},
      ]);

      // Reset mock to track new calls
      jest.clearAllMocks();

      // Switch to Advanced mode
      await searchInput.toggleMode();
      expect(await searchInput.isInAdvancedMode()).toBe(true);

      // Verify Advanced mode shows all users (no filtering applied)
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([]);
      expect(mockDataProvider.load).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // Switch back to Basic mode
      await searchInput.toggleMode();
      expect(await searchInput.isInAdvancedMode()).toBe(false);

      // Verify Basic mode again applies local user filtering
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          [
            'OR',
            [
              [
                ['local', '=', true],
                ['builtin', '=', false],
              ],
              ['username', '=', 'root'],
            ],
          ],
        ],
        {},
      ]);
    });
  });

  describe('Search Mode Switching - Query Clearing', () => {
    it('clears search queries when switching modes and maintains correct default filtering', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);

      // 1. Enter basic search query
      await searchInput.setValue('localuser');
      const searchButton = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await searchButton.click();

      // Verify basic search filtering is applied
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          [
            'OR',
            [
              ['username', '~', '(?i)localuser'],
              [
                ['full_name', '~', '(?i)localuser'],
                [
                  'OR',
                  [
                    [
                      ['local', '=', true],
                      ['builtin', '=', false],
                    ],
                    ['username', '=', 'root'],
                  ],
                ],
              ],
            ],
          ],
        ],
        {},
      ]);

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 2. Switch to Advanced mode
      await searchInput.toggleMode();

      // Verify Advanced mode is active and shows all users (search input may have default query)
      expect(await searchInput.isInAdvancedMode()).toBe(true);
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([]);
      expect(mockDataProvider.load).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 3. Enter advanced query
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);
      await advancedModeHarness.setValue('Username = "root"');
      await searchButton.click();

      // Verify advanced filtering is applied (implementation will depend on the advanced search parsing)
      expect(mockDataProvider.setParams).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 4. Switch back to Basic mode
      await searchInput.toggleMode();

      // Verify back in Basic mode and default local users filtering is restored
      expect(await searchInput.isInAdvancedMode()).toBe(false);
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          [
            'OR',
            [
              [
                ['local', '=', true],
                ['builtin', '=', false],
              ],
              ['username', '=', 'root'],
            ],
          ],
        ],
        {},
      ]);
    });
  });
});
