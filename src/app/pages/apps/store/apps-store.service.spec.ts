import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, firstValueFrom, filter, throwError } from 'rxjs';
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
    isSyncingCatalog: false,
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

  it('sets isLoading to false after initial data load completes', async () => {
    // Create a new instance to track loading state changes
    const newSpectator = createService();

    // Track isLoading state changes
    const loadingStates: boolean[] = [];
    newSpectator.service.isLoading$.subscribe((isLoading) => {
      loadingStates.push(isLoading);
    });

    // Initialize should trigger data load
    newSpectator.service.initialize();

    // Wait for async operations to complete
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

    // Verify isLoading was set to false after data load
    // Should be: [initial false, true during load, false after load]
    expect(loadingStates).toContain(false);
    expect(loadingStates[loadingStates.length - 1]).toBe(false);
  });

  it('does not trigger catalog sync when data is available', async () => {
    // This test verifies that when catalog has data, sync is not triggered
    // and loading is cleared immediately after data load
    const apiService = spectator.inject(ApiService);
    const jobSpy = jest.spyOn(apiService, 'job');

    // Clear any previous calls
    jobSpy.mockClear();

    // Re-initialize with data available
    spectator.service.initialize();

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 100);
    });

    // Verify catalog.sync was NOT called since data exists
    expect(jobSpy).not.toHaveBeenCalled();

    // Verify loading is false
    const isLoading = await firstValueFrom(spectator.service.isLoading$);
    expect(isLoading).toBe(false);
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
      // Clear previous mock calls from initialization
      jest.clearAllMocks();

      // Setup mocks to return empty initially
      jest.spyOn(appsServiceMock, 'getAvailableApps').mockReturnValueOnce(of([]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getLatestApps').mockReturnValueOnce(of([]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getAllAppsCategories').mockReturnValueOnce(of([]) as Observable<string[]>);

      // After sync, mock should return data
      jest.spyOn(appsServiceMock, 'getAvailableApps').mockReturnValueOnce(of(availableApps) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getLatestApps').mockReturnValueOnce(of([installedAndRecommendedApp]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getAllAppsCategories').mockReturnValueOnce(of(['storage', 'media']) as Observable<string[]>);

      // Trigger a fresh initialization
      emptySpectator.service.initialize();

      // Verify data loading methods are called exactly twice: initial load + reload after sync
      expect(appsServiceMock.getAvailableApps).toHaveBeenCalledTimes(2);
      expect(appsServiceMock.getLatestApps).toHaveBeenCalledTimes(2);
      expect(appsServiceMock.getAllAppsCategories).toHaveBeenCalledTimes(2);
    });

    it('sets isLoading to false after sync completes', async () => {
      // Wait for isLoading to become false using RxJS firstValueFrom
      const isLoadingFalse = await firstValueFrom(
        emptySpectator.service.isLoading$.pipe(
          filter((isLoading) => isLoading === false),
        ),
      );

      expect(isLoadingFalse).toBe(false);
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

    it('handles sync job failure gracefully', async () => {
      const errorMockDialogRef = {
        afterClosed: jest.fn(() => throwError(() => new Error('Sync failed'))),
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;

      jest.spyOn(emptySpectator.inject(DialogService), 'jobDialog').mockReturnValue(errorMockDialogRef);
      jest.clearAllMocks();

      emptySpectator.service.initialize();

      // Wait for error handling to complete
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      // Verify error modal was shown with correct message
      expect(emptySpectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(
        new Error('Failed to sync catalog. Please try clicking "Refresh Catalog" manually.'),
      );

      // Verify loading state is set to false
      const isLoading = await firstValueFrom(
        emptySpectator.service.isLoading$.pipe(
          filter((loading) => loading === false),
        ),
      );
      expect(isLoading).toBe(false);
    });

    it('handles individual service failures during reload after sync', async () => {
      // Reset mocks and setup for this test
      jest.clearAllMocks();

      // First load returns empty (triggers sync)
      jest.spyOn(appsServiceMock, 'getAvailableApps')
        .mockReturnValueOnce(of([]) as Observable<AvailableApp[]>)
        .mockReturnValueOnce(throwError(() => new Error('Reload failed')));
      jest.spyOn(appsServiceMock, 'getLatestApps')
        .mockReturnValueOnce(of([]) as Observable<AvailableApp[]>)
        .mockReturnValueOnce(of([installedAndRecommendedApp]) as Observable<AvailableApp[]>);
      jest.spyOn(appsServiceMock, 'getAllAppsCategories')
        .mockReturnValueOnce(of([]) as Observable<string[]>)
        .mockReturnValueOnce(of(['storage', 'media']) as Observable<string[]>);

      // Setup successful sync dialog
      const successMockDialogRef = {
        afterClosed: jest.fn(() => of(true)),
        getSubscriptionLimiterInstance: jest.fn(),
      } as unknown as JobProgressDialogRef<unknown>;
      jest.spyOn(emptySpectator.inject(DialogService), 'jobDialog').mockReturnValue(successMockDialogRef);

      emptySpectator.service.initialize();

      // Wait for error handling to complete
      await new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 100);
      });

      // Verify error modal was shown (individual service error is caught and handled)
      expect(emptySpectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalledWith(
        new Error('Reload failed'),
      );

      // Verify loading state is set to false
      const isLoading = await firstValueFrom(
        emptySpectator.service.isLoading$.pipe(
          filter((loading) => loading === false),
        ),
      );
      expect(isLoading).toBe(false);
    });
  });
});
