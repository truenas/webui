import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { KubernetesStore } from 'app/pages/apps/store/kubernetes-store.service';

describe('InstalledAppsStore', () => {
  let spectator: SpectatorService<InstalledAppsStore>;
  let testScheduler: TestScheduler;

  const installedChartReleases: ChartRelease[] = [
    {
      name: 'minio',
    } as unknown as ChartRelease,
  ];

  const createService = createServiceFactory({
    service: InstalledAppsStore,
    providers: [
      mockProvider(ApplicationsService, {
        getInstalledAppsStatusUpdates: jest.fn(() => {
          return of() as Observable<ApiEvent<Job<ChartScaleResult, ChartScaleQueryParams>>>;
        }),
        getInstalledAppsUpdates: jest.fn(() => of()) as () => Observable<ApiEvent<ChartRelease>>,
        getAllChartReleases: jest.fn(() => {
          return of([
            ...installedChartReleases,
          ] as ChartRelease[]);
        }) as () => Observable<ChartRelease[]>,
      }),
      mockProvider(AppsStore, {
        patchState: jest.fn(),
      }),
      mockProvider(KubernetesStore, {
        isLoading$: of(false),
        isKubernetesStarted$: of(true),
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
