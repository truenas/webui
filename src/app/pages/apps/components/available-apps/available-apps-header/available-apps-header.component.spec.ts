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
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';

describe('AvailableAppsHeaderComponent', () => {
  let spectator: Spectator<AvailableAppsHeaderComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  let catalogsItems: IxFilterSelectListHarness;
  let sortItems: IxFilterSelectListHarness;
  let categoriesSelect: IxChipsHarness;
  let applyButton: MatButtonHarness;
  let availableAppsStore: AvailableAppsStore;

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
      mockProvider(AvailableAppsStore, {
        availableApps$: of([{
          catalog: 'OFFICIAL',
          categories: ['storage', 'crypto'],
          last_update: { $date: 452 },
          name: 'chia',
        }, {
          catalog: 'TEST',
          categories: ['media', 'torrent'],
          last_update: { $date: 343 },
          name: 'qbittorent',
        }] as AvailableApp[]),
        installedApps$: of([{}, {}, {}] as ChartRelease[]),
        filterValues$: of({
          catalogs: ['OFFICIAL'],
          sort: null,
          categories: ['storage', 'crypto', 'media', 'torrent'],
        }),
        appsCategories$: of(['storage', 'crypto', 'media', 'torrent']),
        isFilterApplied$: of(false),
        searchQuery$: of(''),
        applySearchQuery: jest.fn(),
        applyFilters: jest.fn(),
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
    applyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }));
    availableAppsStore = spectator.inject(AvailableAppsStore);
  });

  it('checks the displayed numbers', () => {
    const numbers = spectator.queryAll('.header-number h2');

    expect(numbers[0]).toHaveText('2'); // available apps
    expect(numbers[1]).toHaveText('3'); // installed apps
    expect(numbers[2]).toHaveText('2'); // installed catalogs
  });

  it('calls applySearchQuery when user types in the search input', async () => {
    await searchInput.setValue('search string');
    expect(availableAppsStore.applySearchQuery).toHaveBeenLastCalledWith('search string');
  });

  it('calls applyFilters when user selects catalogs', async () => {
    await catalogsItems.setValue(['OFFICIAL']);
    await applyButton.click();

    expect(availableAppsStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL'],
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
    await applyButton.click();

    expect(availableAppsStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL', 'TEST'],
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
    await categoriesSelect.setValue(['storage']);
    await applyButton.click();

    expect(availableAppsStore.applyFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL', 'TEST'],
      sort: null,
      categories: ['storage'],
    });
  });
});
