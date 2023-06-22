import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsByCategory, AppsState, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

describe('AppsStore', () => {
  let spectator: SpectatorService<AppsStore>;
  let testScheduler: TestScheduler;

  const initialState: AppsState = {
    availableApps: [],
    recommendedApps: [],
    latestApps: [],
    categories: [],
    catalogs: [],
    filteredApps: [],
    isLoading: false,
    isFilterApplied: false,
    filter: {
      categories: [],
      sort: null,
      catalogs: [],
    },
    searchQuery: '',
    installedApps: [],
    selectedPool: null,
    isKubernetesStarted: false,
  };

  const installedChartReleases: ChartRelease[] = [
    {
      name: 'minio',
    } as unknown as ChartRelease,
  ];

  const installedAndRecommendedApp: AvailableApp = {
    catalog: 'TRUENAS',
    installed: true,
    categories: ['storage'],
    description: 'Syncthing is a continuous file synchronization program.',
    last_update: { $date: 1683822035000 },
    name: 'syncthing',
    recommended: true,
    title: 'Syncthing',
  } as unknown as AvailableApp;

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
  } as unknown as AvailableApp;
  const availableApps: AvailableApp[] = [
    { ...plexApp },
    { ...installedAndRecommendedApp },
  ];

  const createService = createServiceFactory({
    service: AppsStore,
    providers: [
      mockProvider(DialogService, {
        error: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        parseWsError: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        getAvailableApps: jest.fn(() => of(availableApps)) as () => Observable<AvailableApp[]>,
        getLatestApps: jest.fn(() => of([{ ...installedAndRecommendedApp }])) as () => Observable<AvailableApp[]>,
        subscribeToAllChartReleases: jest.fn(() => of()) as () => Observable<ApiEvent<ChartRelease>>,
        getAllAppsCategories: jest.fn(() => of(['storage', 'media'])) as () => Observable<string[]>,
        getKubernetesConfig: jest.fn(() => {
          return of({ pool: 'ix-applications-pool' } as KubernetesConfig);
        }) as () => Observable<KubernetesConfig>,
        getKubernetesServiceStarted: jest.fn(() => of(true)) as () => Observable<boolean>,
        getAllChartReleases: jest.fn(() => {
          return of([
            ...installedChartReleases,
          ] as ChartRelease[]);
        }) as () => Observable<ChartRelease[]>,
        convertDateToRelativeDate: jest.fn(() => ''),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.initialize();
    testScheduler = getTestScheduler();
  });

  it('initializes the correct state', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.state$).toBe('b', {
        b: {
          ...initialState,
          availableApps: [...availableApps],
          categories: ['storage', 'media'],
          catalogs: ['TRUENAS'],
          installedApps: [...installedChartReleases],
          isKubernetesStarted: true,
          selectedPool: 'ix-applications-pool',
          latestApps: [{ ...installedAndRecommendedApp }],
          recommendedApps: [{ ...installedAndRecommendedApp, categories: ['storage', 'Recommended'] }],
          filteredApps: [],

        } as AppsState,
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
        catalogs: [],
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

  it('returns the correct searched apps with the catalog sorting', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isFilterApplied$).toBe('a', {
        a: false,
      });
    });
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        catalogs: [],
        categories: ['media'],
        sort: AppsFiltersSort.Catalog,
      });
      expectObservable(spectator.service.searchedApps$).toBe('b', {
        b: [{
          category: 'TRUENAS',
          title: 'TRUENAS',
          totalApps: 2,
          apps: [...availableApps],
        }],
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
        catalogs: [],
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

  it('emits the categories with the extra categories added in', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.appsCategories$).toBe('a', {
        a: [
          'storage',
          'media',
          AppExtraCategory.NewAndUpdated,
          AppExtraCategory.Recommended,
        ],
      });
    });
  });

  it('emits the available apps returned by middleware', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.availableApps$).toBe('a', {
        a: [...availableApps],
      });
    });
  });

  it('emits the installed apps returned by middleware', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.installedApps$).toBe('a', {
        a: [...installedChartReleases],
      });
    });
  });

  it('emits the pool returned by middleware', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.selectedPool$).toBe('a', {
        a: 'ix-applications-pool',
      });
    });
  });

  it('emits the correct filter values when they are updated', () => {
    testScheduler.run(({ expectObservable }) => {
      spectator.service.applyFilters({
        categories: ['storage'],
        catalogs: ['TRUENAS'],
        sort: AppsFiltersSort.Name,
      });
      expectObservable(spectator.service.filterValues$).toBe('a', {
        a: {
          categories: ['storage'],
          catalogs: ['TRUENAS'],
          sort: AppsFiltersSort.Name,
        } as AppsFiltersValues,
      });
    });
  });

  it('emits the kubernetes status', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.isKubernetesStarted$).toBe('a', {
        a: true,
      });
    });
  });

  it('emits apps grouped by categories for dashboard', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.appsByCategories$).toBe('a', {
        a: [
          {
            apps: [
              { ...installedAndRecommendedApp },
            ],
            category: 'New and Updated',
            title: 'New & Updated Apps',
            totalApps: 1,
          },
          {
            apps: [
              { ...installedAndRecommendedApp, categories: ['storage', AppExtraCategory.Recommended] },
            ],
            category: 'Recommended',
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
