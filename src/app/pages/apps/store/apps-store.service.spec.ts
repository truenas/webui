import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { mockJob } from 'app/core/testing/utils/mock-api.utils';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App } from 'app/interfaces/app.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsState, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

  const mockDialogRef = {
    afterClosed: jest.fn(() => of(true)),
    getSubscriptionLimiterInstance: jest.fn(),
  } as unknown as JobProgressDialogRef<unknown>;

  const createService = createServiceFactory({
    service: AppsStore,
    providers: [
      mockProvider(DialogService, {
        error: jest.fn(),
        jobDialog: jest.fn(() => mockDialogRef),
      }),
      mockProvider(ErrorHandlerService, {
        showErrorModal: jest.fn(),
      }),
      mockProvider(ApiService, {
        job: jest.fn(() => mockJob('catalog.sync')),
      }),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => key),
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

  describe('when catalog is empty on first load', () => {
    let emptySpectator: SpectatorService<AppsStore>;
    let emptyMockDialogRef: JobProgressDialogRef<unknown>;
    let appsServiceMock: ApplicationsService;

    const createEmptyService = createServiceFactory({
      service: AppsStore,
      providers: [
        mockProvider(DialogService, {
          error: jest.fn(),
          jobDialog: jest.fn(),
        }),
        mockProvider(ErrorHandlerService, {
          showErrorModal: jest.fn(),
        }),
        mockProvider(ApiService, {
          job: jest.fn(() => mockJob('catalog.sync')),
        }),
        mockProvider(TranslateService, {
          instant: jest.fn((key: string) => key),
        }),
        mockProvider(ApplicationsService, {
          getAvailableApps: jest.fn(),
          getLatestApps: jest.fn(),
          getAllAppsCategories: jest.fn(),
          convertDateToRelativeDate: jest.fn(() => ''),
        }),
      ],
    });

    beforeEach(() => {
      emptySpectator = createEmptyService();
      appsServiceMock = emptySpectator.inject(ApplicationsService);

      // First load returns empty data
      jest.spyOn(appsServiceMock, 'getAvailableApps').mockReturnValue(of([]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getLatestApps').mockReturnValue(of([]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getAllAppsCategories').mockReturnValue(of([]) as Observable<string[]>);

      emptyMockDialogRef = {
        afterClosed: jest.fn(() => of(true)),
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;

      jest.spyOn(emptySpectator.inject(DialogService), 'jobDialog').mockReturnValue(emptyMockDialogRef);

      emptySpectator.service.initialize();
    });

    it('shows job dialog with descriptive message during sync', () => {
      expect(emptySpectator.inject(DialogService).jobDialog).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          title: 'Syncing Catalog',
          description: 'The catalog is being synced for the first time. This may take a few minutes.',
          canMinimize: true,
        }),
      );
    });

    it('calls catalog.sync job', () => {
      expect(emptySpectator.inject(ApiService).job).toHaveBeenCalledWith('catalog.sync');
    });

    it('reloads catalog data after sync completes', () => {
      // After sync, mock should return data
      jest.spyOn(appsServiceMock, 'getAvailableApps').mockReturnValue(of(availableApps));
      jest.spyOn(appsServiceMock, 'getLatestApps').mockReturnValue(of([installedAndRecommendedApp]));
      jest.spyOn(appsServiceMock, 'getAllAppsCategories').mockReturnValue(of(['storage', 'media']));

      // Verify data loading methods are called again after sync
      const availableAppsCalls = (appsServiceMock.getAvailableApps as jest.Mock).mock.calls.length;
      expect(availableAppsCalls).toBeGreaterThanOrEqual(2); // Initial + after sync
    });

    it('sets isLoading to false after sync completes', async () => {
      // Wait for the observable to emit false
      const isLoadingValues: boolean[] = [];
      const subscription = emptySpectator.service.isLoading$.subscribe((value) => {
        isLoadingValues.push(value);
      });

      // Give time for async operations to complete
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      subscription.unsubscribe();

      // Should eventually emit false
      expect(isLoadingValues).toContain(false);
    });

    it('does not sync again when catalog has data', () => {
      const initialCallCount = (emptySpectator.inject(ApiService).job as jest.Mock).mock.calls.length;

      // After first sync, update mocks to return data
      jest.spyOn(appsServiceMock, 'getAvailableApps').mockReturnValue(of(availableApps));
      jest.spyOn(appsServiceMock, 'getLatestApps').mockReturnValue(of([installedAndRecommendedApp]));
      jest.spyOn(appsServiceMock, 'getAllAppsCategories').mockReturnValue(of(['storage', 'media']));

      // Second initialization should not trigger another sync because data exists
      emptySpectator.service.initialize();

      const finalCallCount = (emptySpectator.inject(ApiService).job as jest.Mock).mock.calls.length;
      // Should still be the same count since catalog now has data
      expect(finalCallCount).toBe(initialCallCount);
    });
  });
});
