import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { AdvancedSearchHarness } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.harness';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/forms/search-input/components/search-input/search-input.harness';
import { mockUserApiDataProvider } from 'app/pages/credentials/new-users/all-users/testing/mock-user-api-data-provider';
import { UsersSearchComponent } from 'app/pages/credentials/new-users/all-users/users-search/users-search.component';

describe('UsersSearchComponent', () => {
  let spectator: Spectator<UsersSearchComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: UsersSearchComponent,
    imports: [
      SearchInputComponent,
    ],
    providers: [mockApi([
      mockCall('directoryservices.get_state', {
        activedirectory: DirectoryServiceState.Healthy,
        ldap: DirectoryServiceState.Disabled,
      }),
    ])],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataProvider: mockUserApiDataProvider,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('performs search with the correct value', async () => {
    const searchInput = await loader.getHarness(SearchInputHarness);
    await searchInput.setValue('root');
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Search' }));
    await button.click();
    expect(mockUserApiDataProvider.setParams).toHaveBeenCalledWith(
      [
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
                'full_name',
                '~',
                '(?i)root',
              ],
            ],
          ],
        ],
        {},
      ],
    );
    await searchInput.toggleMode();
    const advancedModeHarness = await (searchInput.getActiveModeHarness() as Promise<AdvancedSearchHarness>);
    await advancedModeHarness.setValue('"Built in" = false');
    await button.click();
    expect(mockUserApiDataProvider.setParams).toHaveBeenCalledWith([[['builtin', '=', false]]]);
    expect(mockUserApiDataProvider.load).toHaveBeenCalled();
  });
});
