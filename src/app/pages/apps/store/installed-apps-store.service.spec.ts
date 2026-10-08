import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { firstValueFrom, Observable, of, Subject } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { getTestScheduler } from 'app/core/testing/utils/get-test-scheduler.utils';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams } from 'app/interfaces/app.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { Job } from 'app/interfaces/job.interface';
import { AppQueryEvent, ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsState, AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppsStore', () => {
  let spectator: SpectatorService<InstalledAppsStore>;
  let testScheduler: TestScheduler;
  let appEvents$: Subject<AppQueryEvent>;

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
        getInstalledAppsUpdates: jest.fn(() => appEvents$),
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
    appEvents$ = new Subject<AppQueryEvent>();
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

  describe('installed app events', () => {
    const availableApps = [{ name: 'minio' }, { name: 'plex' }] as AvailableApp[];

    function lastAvailableAppsPatch(): AvailableApp[] {
      const patchState = spectator.inject(AppsStore).patchState as jest.Mock;
      const updater = patchState.mock.calls.at(-1)[0] as (state: AppsState) => AppsState;
      return updater({ availableApps, recommendedApps: [], latestApps: [] } as AppsState).availableApps;
    }

    it('adds an installed app and marks it installed in the catalog', async () => {
      appEvents$.next({ msg: 'added', id: 'plex', fields: { id: 'plex', name: 'plex' } as App });

      expect(await firstValueFrom(spectator.service.installedApps$)).toEqual([
        { name: 'minio' },
        { id: 'plex', name: 'plex' },
      ]);
      expect(lastAvailableAppsPatch()).toEqual([{ name: 'minio' }, { name: 'plex', installed: true }]);
    });

    it('merges a change into the installed app it names', async () => {
      appEvents$.next({ msg: 'changed', id: 'minio', fields: { id: 'minio', version: '2.0' } as App });

      expect(await firstValueFrom(spectator.service.installedApps$)).toEqual([
        { name: 'minio', id: 'minio', version: '2.0' },
      ]);
    });

    it('drops a removed app and marks it not installed in the catalog', async () => {
      appEvents$.next({ msg: 'removed', id: 'minio' });

      expect(await firstValueFrom(spectator.service.installedApps$)).toEqual([]);
      expect(lastAvailableAppsPatch()).toEqual([{ name: 'minio', installed: false }, { name: 'plex' }]);
    });
  });
});
