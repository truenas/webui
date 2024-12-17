import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { subHours, subMinutes } from 'date-fns';
import {
  Observable, Subject, catchError, combineLatestWith, debounceTime,
  filter,
  forkJoin, map, of, repeat, shareReplay, switchMap, take, throttleTime, timer,
} from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { VolumesData, VolumeData } from 'app/interfaces/volume-data.interface';
import { processNetworkInterfaces } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.utils';
import { poolStore } from 'app/services/global-store/stores.constant';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

/**
 * This service provides data for widgets.
 *
 * 1. Do not do processing here. Process in widgets if necessary.
 * 2. Share responses via `shareReplay` to prevent multiple requests.
 * 3. Use `toLoadingState` to provide widget with loading status.
 * 4. Use subscriptions when possible.
 */
@Injectable({
  providedIn: 'root',
})
export class WidgetResourcesService {
  readonly realtimeUpdates$ = this.api.subscribe('reporting.realtime');

  readonly refreshInterval$ = timer(0, 5000);
  private readonly triggerRefreshSystemInfo$ = new Subject<void>();

  readonly backups$ = forkJoin([
    this.api.call('replication.query'),
    this.api.call('rsynctask.query'),
    this.api.call('cloudsync.query'),
  ]).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly systemInfo$ = this.api.call('webui.main.dashboard.sys_info').pipe(
    repeat({ delay: () => this.triggerRefreshSystemInfo$ }),
    debounceTime(300),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly cpuModel$ = this.store$.pipe(
    waitForSystemInfo,
    map((systemInfo) => systemInfo.model),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly networkInterfaces$ = this.api.call('interface.query').pipe(
    map((interfaces) => processNetworkInterfaces(interfaces)),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly installedApps$ = this.api.callAndSubscribe('app.query').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly pools$ = inject(poolStore).callAndSubscribe.pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly volumesData$ = this.pools$.pipe(
    switchMap(() => this.api.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }])),
    map((datasets) => this.parseVolumeData(datasets)),
  );

  readonly updateAvailable$ = this.api.call('update.check_available').pipe(
    map((update) => update.status === SystemUpdateStatus.Available),
    catchError(() => of(false)),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  readonly serverTime$ = this.store$.pipe(
    waitForSystemInfo,
    map((systemInfo) => new Date(systemInfo.datetime.$date)),
    combineLatestWith(this.refreshInterval$),
    map(([serverTime]) => {
      serverTime.setSeconds(serverTime.getSeconds() + 5);
      return serverTime;
    }),
  );

  cpuLastMinuteStats(minutes = 1): Observable<ReportingData[]> {
    return this.serverTime$.pipe(
      take(1),
      switchMap((serverTime) => {
        const end = Math.floor(serverTime.getTime() / 1000);
        const start = Math.floor(subMinutes(serverTime, minutes).getTime() / 1000);

        return this.api.call('reporting.netdata_get_data', [[{ name: 'cpu' }], { end, start }]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  networkInterfaceLastHourStats(interfaceName: string): Observable<ReportingData[]> {
    return this.serverTime$.pipe(
      take(1),
      switchMap((serverTime) => {
        const end = Math.floor(serverTime.getTime() / 1000);
        const start = Math.floor(subHours(serverTime, 1).getTime() / 1000);
        return this.api.call('reporting.netdata_get_data', [[{
          identifier: interfaceName,
          name: 'interface',
        }], { end, start }]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getPoolById(poolId: string): Observable<Pool> {
    return this.pools$.pipe(
      map((pools) => pools.find((pool) => pool.id === +poolId || pool.name === poolId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getPoolByName(poolName: string): Observable<Pool> {
    return this.api.call('pool.query', [[['name', '=', poolName]]]).pipe(
      map((pools) => pools[0]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDatasetById(datasetId: string): Observable<Dataset> {
    return this.api.call('pool.dataset.query', [[['id', '=', datasetId]]]).pipe(
      map((response) => response[0]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDisksByPoolId(poolId: string): Observable<Disk[]> {
    return this.api.call('disk.query', [[], { extra: { pools: true } }]).pipe(
      map((response) => response.filter((disk: Disk) => disk.pool === poolId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getApp(appName: string): Observable<LoadingState<App>> {
    return this.installedApps$.pipe(
      map((apps) => {
        const app = apps.find((installedApp) => installedApp.name === appName);
        if (!app) {
          throw new Error(`App «${appName}» not found. Configure widget to choose another app.`);
        }
        return app;
      }),
      toLoadingState(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getAppStats(appName: string): Observable<LoadingState<AppStats>> {
    return this.api.subscribe('app.stats').pipe(
      filter(() => Boolean(appName)),
      map((event) => event.fields.find((stats) => stats.app_name === appName)),
      throttleTime(500),
      toLoadingState(),
    );
  }

  getAppStatusUpdates(appName: string): Observable<Job<void, AppStartQueryParams>> {
    return this.api.subscribe('core.get_jobs').pipe(
      filter((event) => ['app.start', 'app.stop'].includes(event.fields.method)),
      filter((event: ApiEvent<Job<void, AppStartQueryParams>>) => event.fields.arguments[0] === appName),
      map((event) => event.fields),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  constructor(
    private api: ApiService,
    private store$: Store<AppState>,
  ) {}

  private parseVolumeData(datasets: Dataset[]): VolumesData {
    const volumesData = new Map<string, VolumeData>();

    datasets.forEach((dataset) => {
      if (typeof dataset === 'undefined' || !dataset) {
        return;
      }

      volumesData.set(dataset.id, {
        id: dataset.id,
        avail: dataset.available.parsed,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed) * 100).toFixed(0) + '%',
      });
    });
    return volumesData;
  }

  refreshSystemInfo(): void {
    this.triggerRefreshSystemInfo$.next();
  }
}
