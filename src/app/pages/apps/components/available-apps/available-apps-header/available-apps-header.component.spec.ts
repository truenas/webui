import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { byText } from '@ngneat/spectator';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { App } from 'app/interfaces/app.interface';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { FilterSelectListComponent } from 'app/pages/apps/components/filter-select-list/filter-select-list.component';
import { FilterSelectListHarness } from 'app/pages/apps/components/filter-select-list/filter-select-list.harness';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AvailableAppsHeaderComponent', () => {
  let spectator: Spectator<AvailableAppsHeaderComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  let sortItems: FilterSelectListHarness;
  let categoriesSelect: IxChipsHarness;
  let appsFilterStore: AppsFilterStore;

  const createComponent = createComponentFactory({
    component: AvailableAppsHeaderComponent,
    imports: [
      ReactiveFormsModule,
      FilterSelectListComponent,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('app.query', [{}, {}, {}] as App[]),
        mockJob('catalog.sync'),
      ]),
      mockProvider(InstalledAppsStore, {
        installedApps$: of([{}, {}, {}] as App[]),
      }),
      mockProvider(AppsFilterStore, {
        isFilterApplied$: of(false),
        filterValues$: of({
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
          categories: ['storage', 'crypto'],
          last_update: { $date: 452 },
          name: 'chia',
        }, {
          categories: ['media', 'torrent'],
          last_update: { $date: 343 },
          name: 'qbittorent',
        }] as AvailableApp[]),
        appsCategories$: of(['storage', 'crypto', 'media', 'torrent']),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const filtersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Filters' }));
    await filtersButton.click();

    searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: 'Search' }));
    sortItems = (await loader.getAllHarnesses(FilterSelectListHarness))[0];
    categoriesSelect = await loader.getHarness(IxChipsHarness);
    appsFilterStore = spectator.inject(AppsFilterStore);
  });

  it('checks the displayed numbers', () => {
    const numbers = spectator.queryAll('.header-number h2');

    expect(numbers[0]).toHaveText('2'); // available apps
    expect(numbers[1]).toHaveText('3'); // installed apps
  });

  it('calls applySearchQuery when user types in the search input', async () => {
    await searchInput.setValue('search string');
    expect(appsFilterStore.applySearchQuery).toHaveBeenLastCalledWith('search string');
  });

  it('calls applyFilters when user selects sort', async () => {
    await sortItems.setValue(['Updated Date']);

    expect(appsFilterStore.applyFilters).toHaveBeenLastCalledWith({
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
      sort: null,
      categories: ['storage'],
    });
  });

  it('refreshes app when Refresh Catalog is pressed', () => {
    spectator.click(spectator.query(byText('Refresh Catalog')));

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('catalog.sync');
  });
});
