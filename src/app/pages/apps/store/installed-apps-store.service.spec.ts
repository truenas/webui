import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
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
        getInstalledAppsUpdates: jest.fn(() => of()) as () => Observable<ApiEvent<App>>,
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
});
