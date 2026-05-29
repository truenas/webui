import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, Subject, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { CollectionChangeType } from 'app/enums/api.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppsStore', () => {
  let spectator: SpectatorService<InstalledAppsStore>;
  let testScheduler: TestScheduler;
  let installedAppsUpdates$: Subject<ApiEvent<App>>;

  const installedChartReleases: App[] = [
    {
      name: 'minio',
    } as App,
  ];

  const createService = createServiceFactory({
    service: InstalledAppsStore,
    providers: [
      mockProvider(ApplicationsService, {
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<unknown, AppStartQueryParams>>>;
        }),
        getInstalledAppsUpdates: jest.fn(() => installedAppsUpdates$) as () => Observable<ApiEvent<App>>,
        getAllApps: jest.fn(() => {
          return of([
            ...installedChartReleases,
          ] as App[]);
        }) as () => Observable<App[]>,
      }),
      mockProvider(AppsStore, {
        patchState: jest.fn(),
      }),
      mockProvider(AppsStatsService),
      mockProvider(DockerStore, {
        isLoading$: of(false),
        isDockerStarted$: of(true),
      }),
    ],
  });

  beforeEach(() => {
    installedAppsUpdates$ = new Subject<ApiEvent<App>>();
    spectator = createService();
    spectator.service.initialize();
    testScheduler = getTestScheduler();
  });

  it('emits the installed apps returned by middleware', () => {
    testScheduler.run(({ expectObservable }) => {
      expectObservable(spectator.service.installedApps$).toBe('a', {
        a: [...installedChartReleases],
      });
    });
  });

  it('adds a missing app on changed event and marks its catalog app as installed', () => {
    let installedApps: App[] = [];
    spectator.service.installedApps$.subscribe((apps) => {
      installedApps = apps;
    });

    const appsStore = spectator.inject(AppsStore);

    installedAppsUpdates$.next({
      msg: CollectionChangeType.Changed,
      id: 'ollama-release',
      fields: {
        id: 'ollama-release',
        name: 'ollama-release',
        metadata: {
          name: 'ollama',
          train: 'stable',
        },
      } as App,
    } as ApiEvent<App>);

    expect(installedApps).toEqual([
      ...installedChartReleases,
      {
        id: 'ollama-release',
        name: 'ollama-release',
        metadata: {
          name: 'ollama',
          train: 'stable',
        },
      } as App,
    ]);

    expect(appsStore.patchState).toHaveBeenCalledWith(expect.any(Function));
  });
});
