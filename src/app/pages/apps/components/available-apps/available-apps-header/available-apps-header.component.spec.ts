import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatChipInputHarness } from '@angular/material/chips/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { SpectatorHost } from '@ngneat/spectator';
import { createHostFactory } from '@ngneat/spectator/jest';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { AppsFiltersSort } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { IxFilterSelectListHarness } from 'app/pages/apps/modules/custom-forms/components/filter-select-list/filter-select-list.harness';
import { CustomFormsModule } from 'app/pages/apps/modules/custom-forms/custom-forms.module';

describe('AvailableAppsHeaderComponent', () => {
  let spectator: SpectatorHost<AvailableAppsHeaderComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  let catalogsItems: IxFilterSelectListHarness;
  let sortItems: IxFilterSelectListHarness;
  let categoriesSelect: MatChipInputHarness;
  let applyButton: MatButtonHarness;
  let resetButton: MatButtonHarness;
  const changeSearch = jest.fn();
  const changeFilters = jest.fn();

  const createComponent = createHostFactory({
    component: AvailableAppsHeaderComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      CustomFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('app.available', [{
          catalog: 'OFFICIAL',
          categories: ['storage', 'crypto'],
          last_update: '2023-03-01 13:26:19',
          name: 'chia',
        }, {
          catalog: 'TEST',
          categories: ['media', 'torrent'],
          last_update: '2023-02-28 16:37:54',
          name: 'qbittorent',
        }] as AvailableApp[]),
        mockCall('app.categories', ['storage', 'crypto', 'media', 'torrent']),
        mockCall('chart.release.query', [{}, {}, {}] as ChartRelease[]),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent(
      '<ix-available-apps-header (search)="changeSearch($event)" (filters)="changeFilters($event)"></ix-available-apps-header>',
      { hostProps: { changeSearch, changeFilters } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const filtersButton = await loader.getHarness(MatButtonHarness.with({ text: 'Filters' }));
    await filtersButton.click();

    searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: 'Search' }));
    catalogsItems = (await loader.getAllHarnesses(IxFilterSelectListHarness))[0];
    sortItems = (await loader.getAllHarnesses(IxFilterSelectListHarness))[1];
    categoriesSelect = await loader.getHarness(MatChipInputHarness);
    applyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Apply' }));
    resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset' }));
  });

  it('checks the displayed numbers', () => {
    const numbers = spectator.queryAll('.header-number h2');

    expect(numbers[0]).toHaveText('2'); // available apps
    expect(numbers[1]).toHaveText('3'); // installed apps
    expect(numbers[2]).toHaveText('2'); // installed catalogs
  });

  it('emits (search) when user types in the search input', async () => {
    await searchInput.setValue('search string');
    expect(changeSearch).toHaveBeenLastCalledWith('search string');
  });

  it('emits (filters) when user selects catalogs', async () => {
    await catalogsItems.setValue(['OFFICIAL']);
    await applyButton.click();

    expect(changeFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL'],
      sort: undefined,
      categories: [],
    });
  });

  it('emits (filters) when user selects sort', async () => {
    await sortItems.setValue(['Updated Date']);
    await applyButton.click();

    expect(changeFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL', 'TEST'],
      sort: AppsFiltersSort.LastUpdate,
      categories: [],
    });
  });

  it('emits (filters) when user selects categories', async () => {
    await categoriesSelect.setValue('storage');
    await categoriesSelect.blur();
    await applyButton.click();

    expect(changeFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL', 'TEST'],
      sort: undefined,
      categories: ['storage'],
    });
  });

  it('emits (filters) when reset button is pressed', async () => {
    await catalogsItems.setValue(['OFFICIAL']);
    await sortItems.setValue(['Updated Date']);
    await categoriesSelect.setValue('storage');
    await categoriesSelect.blur();
    await applyButton.click();

    expect(changeFilters).toHaveBeenLastCalledWith({
      catalogs: ['OFFICIAL'],
      sort: AppsFiltersSort.LastUpdate,
      categories: ['storage'],
    });

    await resetButton.click();
    expect(changeFilters).toHaveBeenLastCalledWith(undefined);

    expect(spectator.component.form.value).toEqual({
      catalogs: ['OFFICIAL', 'TEST'],
      sort: null,
      categories: [],
    });
  });
});
