import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsState, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

describe('AppsStore', () => {
  let spectator: SpectatorService<AppsStore>;
  let testScheduler: TestScheduler;

  const initialState: AppsState = {
    availableApps: [],
    recommendedApps: [],
    latestApps: [],
    categories: [],
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
    service: AppsStore,
    providers: [
      mockProvider(DialogService, {
        error: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        parseError: jest.fn(),
      }),
      mockProvider(ApplicationsService, {
        getAvailableApps: jest.fn(() => of(availableApps)) as () => Observable<AvailableApp[]>,
        getLatestApps: jest.fn(() => of([{ ...installedAndRecommendedApp }])) as () => Observable<AvailableApp[]>,
        getInstalledAppsUpdates: jest.fn(() => of()) as () => Observable<ApiEvent<App>>,
        getAllAppsCategories: jest.fn(() => of(['storage', 'media'])) as () => Observable<string[]>,
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
          latestApps: [{ ...installedAndRecommendedApp }],
          recommendedApps: [{ ...installedAndRecommendedApp, categories: ['storage', 'recommended'] }],

        } as AppsState,
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
});
