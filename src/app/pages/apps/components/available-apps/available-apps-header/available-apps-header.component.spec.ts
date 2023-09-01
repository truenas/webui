import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { IxChipsHarness } from 'app/modules/ix-forms/components/ix-chips/ix-chips.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { IxFilterSelectListHarness } from 'app/pages/apps/modules/custom-forms/components/filter-select-list/filter-select-list.harness';
import { CustomFormsModule } from 'app/pages/apps/modules/custom-forms/custom-forms.module';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('AvailableAppsHeaderComponent', () => {
  let spectator: Spectator<AvailableAppsHeaderComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  let catalogsItems: IxFilterSelectListHarness;
  let sortItems: IxFilterSelectListHarness;
  let categoriesSelect: IxChipsHarness;
  let appsFilterStore: AppsFilterStore;

  const createComponent = createComponentFactory({
    component: AvailableAppsHeaderComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      CustomFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('chart.release.query', [{}, {}, {}] as ChartRelease[]),
      ]),
      mockProvider(InstalledAppsStore, {
        installedApps$: of([{}, {}, {}] as ChartRelease[]),
      }),
      mockProvider(AppsFilterStore, {
        isFilterApplied$: of(false),
        filterValues$: of({
          catalogs: ['TRUENAS'],
          sort: null,
          categories: ['storage', 'crypto', 'media', 'torrent'],
        }),
        searchQuery$: of(''),
        applyFilters: jest.fn(),
        applySearchQuery: jest.fn(),
      }),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([{
          catalog: 'TRUENAS',
          categories: ['storage', 'crypto'],
          last_update: { $date: 452 },
          name: 'chia',
        }, {
          catalog: 'TEST',
          categories: ['media', 'torrent'],
          last_update: { $date: 343 },
          name: 'qbittorent',
        }] as AvailableApp[]),
        appsCategories$: of(['storage', 'crypto', 'media', 'torrent']),
        catalogs$: of(['TRUENAS', 'TEST']),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const filtersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Filters' }));
    await filtersButton.click();

    searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: 'Search' }));
    catalogsItems = (await loader.getAllHarnesses(IxFilterSelectListHarness))[0];
    sortItems = (await loader.getAllHarnesses(IxFilterSelectListHarness))[1];
    categoriesSelect = await loader.getHarness(IxChipsHarness);
    appsFilterStore = spectator.inject(AppsFilterStore);
  });

  it('checks the displayed numbers', () => {
    const numbers = spectator.queryAll('.header-number h2');

    expect(numbers[0]).toHaveText('2'); // available apps
    expect(numbers[1]).toHaveText('3'); // installed apps
    expect(numbers[2]).toHaveText('2'); // installed catalogs
  });

  it('calls applySearchQuery when user types in the search input', async () => {
    await searchInput.setValue('search string');
    expect(appsFilterStore.applySearchQuery).toHaveBeenLastCalledWith('search string');
  });

  it('calls applyFilters when user selects catalogs', async () => {
    await catalogsItems.setValue(['TRUENAS']);

    expect(appsFilterStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['TRUENAS'],
      sort: null,
      categories: [
        'storage',
        'crypto',
        'media',
        'torrent',
      ],
    });
  });

  it('calls applyFilters when user selects sort', async () => {
    await sortItems.setValue(['Updated Date']);

    expect(appsFilterStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['TRUENAS', 'TEST'],
      sort: AppsFiltersSort.LastUpdate,
      categories: [
        'storage',
        'crypto',
        'media',
        'torrent',
      ],
    });
  });

  it('calls applyFilters when user selects categories', async () => {
    await categoriesSelect.selectSuggestionValue('storage');

    expect(appsFilterStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['TRUENAS', 'TEST'],
      sort: null,
      categories: ['storage'],
    });
  });
});
