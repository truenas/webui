import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceStatus } from 'app/enums/directory-services.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { User } from 'app/interfaces/user.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/forms/search-input/components/search-input/search-input.harness';
import { mockUserApiDataProvider } from 'app/pages/credentials/users/all-users/testing/mock-user-api-data-provider';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';
import * as UsersSearchPresets from 'app/pages/credentials/users/all-users/users-search/users-search-presets';
import { UsersSearchComponent } from 'app/pages/credentials/users/all-users/users-search/users-search.component';

describe('UsersSearchComponent', () => {
  let spectator: Spectator<UsersSearchComponent>;
  let loader: HarnessLoader;
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
          id: 1, username: 'root', builtin: true, local: true, full_name: 'Root User',
        } as User,
        {
          id: 2, username: 'localuser1', builtin: false, local: true, full_name: 'Local User 1',
        } as User,
        {
          id: 3, username: 'localuser2', builtin: false, local: true, full_name: 'Local User 2',
        } as User,
        {
          id: 4, username: 'daemon', builtin: true, local: true, full_name: 'Daemon User',
        } as User,
        {
          id: 5, username: 'www', builtin: true, local: true, full_name: 'Web Server User',
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('Basic Search', () => {
    it('performs search with the correct value with both Local and Directory selected by default', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('root');
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      // With both Local and Directory selected, builtin=false OR local=false filters out builtin local users
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
          ['OR', [['username', '~', '(?i)root'], ['full_name', '~', '(?i)root']]],
        ],
        {},
      ]);
    });

    it('searches with only Local user type selected', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('test');

      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [
          ['local', '=', true],
          ['builtin', '=', false],
          ['OR', [['username', '~', '(?i)test'], ['full_name', '~', '(?i)test']]],
        ],
        {},
      ]);
    });

    it('converts * wildcard to .* in search pattern', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('*user');
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [
          ['local', '=', true],
          ['builtin', '=', false],
          ['OR', [['username', '~', '(?i).*user'], ['full_name', '~', '(?i).*user']]],
        ],
        {},
      ]);
    });

    it('escapes regex special characters in search pattern', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('(test)');
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [
          ['local', '=', true],
          ['builtin', '=', false],
          ['OR', [['username', '~', '(?i)\\(test\\)'], ['full_name', '~', '(?i)\\(test\\)']]],
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

    it('tracks builtin filter state in advanced mode', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Apply builtin filter and verify API call
      await advancedModeHarness.setValue('"Built in" = true');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([[['builtin', '=', true]]]);
    });
  });

  describe('Active Directory Integration', () => {
    it('shows Directory Services option when AD is enabled', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      const options = await selectHarness.getOptionLabels();

      expect(options).toContain('Directory Services');
    });

    it('filters by directory users correctly', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Directory Services']);

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [['local', '=', false]],
        {},
      ]);
    });

    it('updates local filter state when local filter is applied', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Apply local filter (hide AD users) and verify API call
      await advancedModeHarness.setValue('"Local" = true');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([[['local', '=', true]]]);
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
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('does not show Directory Services option when AD is disabled', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      const options = await selectHarness.getOptionLabels();

      expect(options).not.toContain('Directory Services');
      expect(options).toContain('Local');
    });
  });

  describe('Filter Conflict Resolution', () => {
    it('resolves conflicting builtin filters by keeping the latest when entered via advanced search', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Enter query with conflicting builtin filters - latest (false) should be kept
      await advancedModeHarness.setValue('"Built in" = true AND Username ~ "test" AND "Built in" = false');
      await button.click();

      // Verify API receives deduplicated filters with latest builtin value
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['username', '~', 'test'],
          ['builtin', '=', false],
        ],
      ]);
    });

    it('resolves conflicting local filters by keeping the latest when entered via advanced search', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Enter query with conflicting local filters - latest (true) should be kept
      await advancedModeHarness.setValue('"Local" = false AND Username ~ "test" AND "Local" = true');
      await button.click();

      // Verify API receives deduplicated filters with latest local value
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['username', '~', 'test'],
          ['local', '=', true],
        ],
      ]);
    });

    it('preserves multiple different filter types without conflicts', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Enter query with different filter types (no conflicts)
      await advancedModeHarness.setValue('"Built in" = true AND "Local" = false AND Username ~ "test"');
      await button.click();

      // Verify all filters are preserved
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['username', '~', 'test'],
          ['builtin', '=', true],
          ['local', '=', false],
        ],
      ]);
    });
  });

  describe('Search Properties', () => {
    it('allows searching by various user properties in advanced mode', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));

      await searchInput.toggleMode();
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);

      // Test that Username property works (derived from user data)
      await advancedModeHarness.setValue('Username = "root"');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [['username', '=', 'root']],
      ]);

      jest.clearAllMocks();

      // Test that Built in property works
      await advancedModeHarness.setValue('"Built in" = true');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [['builtin', '=', true]],
      ]);

      jest.clearAllMocks();

      // Test that Local property works
      await advancedModeHarness.setValue('"Local" = false');
      await button.click();

      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [['local', '=', false]],
      ]);
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
    it('maintains consistent default filtering when switching between Basic and Advanced modes', async () => {
      const searchInput = await loader.getHarness(SearchInputHarness);

      // Verify component starts in Basic mode
      expect(await searchInput.isInAdvancedMode()).toBe(false);

      // Trigger search with default selection (Local + Directory)
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local', 'Directory Services']);

      // Verify initial Basic mode applies both Local and Directory user filtering
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
        ],
        {},
      ]);

      // Reset mock to track new calls
      jest.clearAllMocks();

      // Switch to Advanced mode
      await searchInput.toggleMode();
      expect(await searchInput.isInAdvancedMode()).toBe(true);

      // Verify Advanced mode applies same default filtering as basic mode for consistency
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
        ],
      ]);
      expect(mockDataProvider.load).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // Switch back to Basic mode
      await searchInput.toggleMode();
      expect(await searchInput.isInAdvancedMode()).toBe(false);

      // Verify Basic mode again applies default filtering
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
        ],
        {},
      ]);
    });
  });

  describe('Search Mode Switching - Query Clearing', () => {
    it('clears search queries when switching modes and maintains correct default filtering', async () => {
      // Select only Local for this test
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);
      jest.clearAllMocks();

      const searchInput = await loader.getHarness(SearchInputHarness);

      // 1. Enter basic search query
      await searchInput.setValue('localuser');
      const searchButton = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await searchButton.click();

      // Verify basic search filtering is applied
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['local', '=', true],
          ['builtin', '=', false],
          ['OR', [['username', '~', '(?i)localuser'], ['full_name', '~', '(?i)localuser']]],
        ],
        {},
      ]);

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 2. Switch to Advanced mode
      await searchInput.toggleMode();

      // Verify Advanced mode is active and applies default filtering for consistency
      expect(await searchInput.isInAdvancedMode()).toBe(true);
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
        ],
      ]);
      expect(mockDataProvider.load).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 3. Enter advanced query
      const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);
      await advancedModeHarness.setValue('Username = "root"');
      await searchButton.click();

      // Verify advanced filtering is applied
      expect(mockDataProvider.setParams).toHaveBeenCalled();

      // Reset mock to track new calls
      jest.clearAllMocks();

      // 4. Switch back to Basic mode
      await searchInput.toggleMode();

      // Verify back in Basic mode. Mode switching resets to defaults (Local + Directory)
      // regardless of the previous selection (which was only Local at the start of this test)
      expect(await searchInput.isInAdvancedMode()).toBe(false);
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['OR', [['builtin', '=', false], ['local', '=', false]]],
        ],
        {},
      ]);
    });
  });

  describe('Show Built-in Users Toggle', () => {
    it('shows built-in users when toggle is enabled', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      await toggleHarness.check();

      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [['local', '=', true]],
        {},
      ]);
    });

    it('disables built-in toggle when Local is not selected', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Directory Services']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      expect(await toggleHarness.isDisabled()).toBe(true);
    });

    it('enables built-in toggle when Local is selected', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      expect(await toggleHarness.isDisabled()).toBe(false);
    });

    it('unchecks toggle when Local is deselected', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      await toggleHarness.check();

      // Deselect Local
      await selectHarness.setValue(['Directory Services']);

      expect(await toggleHarness.isChecked()).toBe(false);
    });

    it('maintains toggle state when searching', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      await toggleHarness.check();
      jest.clearAllMocks();

      // Perform a search
      const searchInput = await loader.getHarness(SearchInputHarness);
      await searchInput.setValue('test');
      const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
      await button.click();

      // Verify toggle state is maintained and filter includes built-in users
      expect(await toggleHarness.isChecked()).toBe(true);
      expect(mockDataProvider.setParams).toHaveBeenCalledWith([
        [
          ['local', '=', true],
          ['OR', [['username', '~', '(?i)test'], ['full_name', '~', '(?i)test']]],
        ],
        {},
      ]);
    });

    it('resets toggle when switching from Basic to Advanced mode', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      await toggleHarness.check();

      expect(await toggleHarness.isChecked()).toBe(true);

      const searchInput = await loader.getHarness(SearchInputHarness);

      // Switch to Advanced mode
      await searchInput.toggleMode();

      // Switch back to Basic mode - toggle should be reset
      await searchInput.toggleMode();

      const newToggleHarness = await loader.getHarness(MatSlideToggleHarness);
      expect(await newToggleHarness.isChecked()).toBe(false);
    });

    it('shows all users when both Local and Directory selected with toggle on', async () => {
      const selectHarness = await loader.getHarness(IxSelectHarness.with({ label: 'Filter by Type' }));
      await selectHarness.setValue(['Local', 'Directory Services']);

      const toggleHarness = await loader.getHarness(MatSlideToggleHarness);
      await toggleHarness.check();

      // With built-in enabled and both types, no filter is needed - show all users
      expect(mockDataProvider.setParams).toHaveBeenLastCalledWith([
        [],
        {},
      ]);
    });
  });
});
