import {
  SpectatorService, createServiceFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsFilterState, AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsByCategory, AppsStore } from 'app/pages/apps/store/apps-store.service';

describe('AppsFilterStore', () => {
  let spectator: SpectatorService<AppsFilterStore>;
  let testScheduler: TestScheduler;

  const initialState: AppsFilterState = {
    filteredApps: [],
    isFilterApplied: false,
    filter: {
      categories: [],
      sort: null,
    },
    searchQuery: '',
    isLoading: false,
  };
  const installedAndRecommendedApp: AvailableApp = {
    catalog: 'TRUENAS',
    installed: true,
    categories: ['storage'],
    description: 'Syncthing is a continuous file synchronization program.',
    last_update: { $date: 1683822035000 },
    name: 'syncthing',
    recommended: true,
    title: 'Syncthing',
  } as AvailableApp;

  const plexApp: AvailableApp = {
    catalog: 'TRUENAS',
    installed: false,
    categories: ['media'],
    description: 'Plex is an app',
    home: 'plex.net',
    last_update: { $date: 1683822036000 },
    name: 'plex',
    recommended: false,
    title: 'Plex',
  } as AvailableApp;
  const availableApps: AvailableApp[] = [
    { ...plexApp },
    { ...installedAndRecommendedApp },
  ];

  const createService = createServiceFactory({
    service: AppsFilterStore,
    providers: [
      mockProvider(AppsStore, {
        availableApps$: of([...availableApps]),
        appsCategories$: of(['storage', 'media'] as string[]),
        recommendedApps$: of([{ ...installedAndRecommendedApp }]) as Observable<AvailableApp[]>,
        latestApps$: of([{ ...installedAndRecommendedApp }]) as Observable<AvailableApp[]>,
      }),
      mockProvider(ApplicationsService, {
        getAvailableApps: jest.fn(() => of(availableApps)) as () => Observable<AvailableApp[]>,
        getLatestApps: jest.fn(() => of([{ ...installedAndRecommendedApp }])) as () => Observable<AvailableApp[]>,
        convertDateToRelativeDate: jest.fn(() => '') as () => string,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = getTestScheduler();
  });

  it('initializes the correct state', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('b', {
        b: {
          ...initialState,
        } as AppsFilterState,
      });
    });
  });

  it('returns the correct searched apps from string', () => {
    spectator.service.applySearchQuery('plex');
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [
          {
            apps: [],
            category: AppExtraCategory.NewAndUpdated,
            title: 'New & Updated Apps',
            totalApps: 0,
          },
          {
            apps: [],
            category: AppExtraCategory.Recommended,
            title: 'Recommended Apps',
            totalApps: 0,
          },
          {
            apps: [],
            category: 'storage',
            title: 'storage',
            totalApps: 0,
          },
          {
            apps: [{ ...plexApp }],
            category: 'media',
            title: 'media',
            totalApps: 1,
          },
        ],
      });
    });
  });

  it('returns the correct searched apps with the name sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isFilterApplied$).toBe('a', {
        a: false,
      });
    });
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        categories: ['media'],
        sort: AppsFiltersSort.Name,
      });
      expectObservable(spectator.service.searchedApps$).toBe('a', {
        a: [
          {
            title: 'P',
            category: 'P',
            totalApps: 1,
            apps: [{ ...plexApp }],
          },
          {
            title: 'S',
            category: 'S',
            totalApps: 1,
            apps: [{ ...installedAndRecommendedApp }],
          },
        ] as AppsByCategory[],
      });
      expectObservable(spectator.service.isFilterApplied$).toBe('a', {
        a: true,
      });
    });
  });

  it('returns the correct searched and filtered apps with the update sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isFilterApplied$).toBe('a', {
        a: false,
      });
    });
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        categories: ['media'],
        sort: AppsFiltersSort.LastUpdate,
      });
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [{
          category: '',
          title: '',
          totalApps: 2,
          apps: [...availableApps],
        }],
      });
      expectObservable(spectator.service.isFilterApplied$).toBe('a', {
        a: true,
      });
    });
  });

  it('emits the updated search query when search query is applied', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applySearchQuery('plex');
      expectObservable(spectator.service.searchQuery$).toBe('a', {
        a: 'plex',
      });
    });
  });

  it('emits the correct filter values when they are updated', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        categories: ['storage'],
        sort: AppsFiltersSort.Name,
      });
      expectObservable(spectator.service.filterValues$).toBe('a', {
        a: {
          categories: ['storage'],
          sort: AppsFiltersSort.Name,
        } as AppsFiltersValues,
      });
    });
  });

  it('emits apps grouped by categories for dashboard', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.appsByCategories$).toBe('a', {
        a: [
          {
            apps: [
              { ...installedAndRecommendedApp, categories: ['storage', AppExtraCategory.NewAndUpdated] },
            ],
            category: AppExtraCategory.NewAndUpdated,
            title: 'New & Updated Apps',
            totalApps: 1,
          },
          {
            apps: [
              { ...installedAndRecommendedApp, categories: ['storage', AppExtraCategory.Recommended] },
            ],
            category: AppExtraCategory.Recommended,
            title: 'Recommended Apps',
            totalApps: 1,
          },
          {
            apps: [
              { ...installedAndRecommendedApp },
            ],
            category: 'storage',
            title: 'storage',
            totalApps: 1,
          },
          {
            apps: [
              { ...plexApp },
            ],
            category: 'media',
            title: 'media',
            totalApps: 1,
          },
        ],
      });
    });
  });
});
