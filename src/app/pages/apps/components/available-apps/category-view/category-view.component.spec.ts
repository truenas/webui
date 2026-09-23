import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent } from 'ng-mocks';
import { Observable, of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import {
  CustomAppButtonComponent,
} from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { CategoryViewComponent } from './category-view.component';

const categoryApps = [{
  categories: ['media'],
  last_update: { $date: 452 },
  name: 'plex',
  title: 'Plex',
  train: 'community',
}] as AvailableApp[];

function mockFilterStore(searchQuery: string, apps: AvailableApp[]): ReturnType<typeof mockProvider> {
  return mockProvider(AppsFilterStore, {
    filterValues$: of({
      sort: null,
      categories: [],
    }),
    isFilterApplied$: of(false),
    searchQuery$: of(searchQuery),
    searchedFilteredApps$: of(apps) as Observable<AvailableApp[]>,
    applySearchQuery: jest.fn(),
    applyFilters: jest.fn(),
    resetFilters: jest.fn(),
    resetFiltersKeepingSearch: jest.fn(),
  });
}

const appsStoreProvider = mockProvider(AppsStore, {
  appsCategories$: of(['storage', 'crypto', 'media', 'torrent', 'new-and-updated']),
  availableApps$: of([{
    categories: ['storage', 'crypto', 'new-and-updated'],
    last_update: { $date: 452 },
    name: 'chia',
  }, {
    categories: ['media', 'torrent', 'new-and-updated'],
    last_update: { $date: 343 },
    name: 'qbittorent',
  }] as AvailableApp[]),
});

const sharedOptions = {
  component: CategoryViewComponent,
  imports: [
    LazyLoadImageDirective,
    ReactiveFormsModule,
    MockComponent(PageHeaderComponent),
    MockComponent(AppCardComponent),
    MockComponent(CustomAppButtonComponent),
  ],
  providers: [
    mockProvider(DockerStore, {
      selectedPool$: of('pool'),
    }),
    appsStoreProvider,
  ],
  params: {
    category: 'new-and-updated',
  },
};

describe('CategoryViewComponent', () => {
  let spectator: SpectatorRouting<CategoryViewComponent>;
  let loader: HarnessLoader;
  let store$: AppsFilterStore;

  const createComponent = createRoutingFactory({
    ...sharedOptions,
    providers: [...sharedOptions.providers, mockFilterStore('', categoryApps)],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(AppsFilterStore);
    spectator.fixture.detectChanges();
  });

  it('should apply filters to the store', () => {
    expect(store$.applyFilters).toHaveBeenCalledWith({
      categories: ['new-and-updated'],
      sort: null,
    });
  });

  it('shows the apps of the category', () => {
    expect(spectator.queryAll('.apps a')).toHaveLength(1);
  });

  it('keeps the search query when the category view is left', () => {
    spectator.fixture.destroy();

    expect(store$.resetFiltersKeepingSearch).toHaveBeenCalled();
    expect(store$.resetFilters).not.toHaveBeenCalled();
  });

  it('should redirect to Discover page', async () => {
    const button = await loader.getHarness(TnButtonHarness.with({ label: 'Back to Discover Page' }));
    await button.click();

    expect(spectator.inject(Router).navigateByUrl).toHaveBeenCalled();
  });

  it('applies a term typed on the page and mirrors it in the url', async () => {
    const searchInput = await loader.getHarness(TnInputHarness.with({ placeholder: 'Search' }));
    await searchInput.setValue('plex');
    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });

    expect(store$.applySearchQuery).toHaveBeenLastCalledWith('plex');
    expect(spectator.inject(Router).navigate).toHaveBeenLastCalledWith([], expect.objectContaining({
      queryParams: { search: 'plex' },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    }));
  });
});

describe('CategoryViewComponent - search handed over from Discover', () => {
  let spectator: SpectatorRouting<CategoryViewComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    ...sharedOptions,
    providers: [...sharedOptions.providers, mockFilterStore('plex', categoryApps)],
    queryParams: { search: 'plex' },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  it('applies the search term handed over in the query parameter', () => {
    expect(spectator.inject(AppsFilterStore).applySearchQuery).toHaveBeenCalledWith('plex');
  });

  it('prefills the search input with the handed over term', async () => {
    const searchInput = await loader.getHarness(TnInputHarness.with({ placeholder: 'Search' }));

    expect(await searchInput.getValue()).toBe('plex');
  });
});

describe('CategoryViewComponent - search without matches', () => {
  let spectator: SpectatorRouting<CategoryViewComponent>;

  const createComponent = createRoutingFactory({
    ...sharedOptions,
    providers: [...sharedOptions.providers, mockFilterStore('nothing-matches-this', [])],
    queryParams: { search: 'nothing-matches-this' },
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.fixture.detectChanges();
  });

  it('shows an empty state instead of an empty grid', () => {
    expect(spectator.query('.apps')).toBeNull();
    expect(spectator.query(EmptyComponent)).toBeTruthy();
  });
});
