import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { subHours, subMinutes } from 'date-fns';
import {
  Observable, Subject, combineLatestWith, debounceTime, filter,
  forkJoin, map, repeat, shareReplay, switchMap, take, timer,
} from 'rxjs';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { App, ChartReleaseStats } from 'app/interfaces/chart-release.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingData } from 'app/interfaces/reporting.interface';
import { VolumesData, VolumeData } from 'app/interfaces/volume-data.interface';
import { processNetworkInterfaces } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.utils';
import { WebSocketService } from 'app/services/ws.service';
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
  // TODO: nosub is emitted for some reason
  readonly realtimeUpdates$ = this.ws.subscribe('reporting.realtime');
  readonly appStatsUpdates$ = this.ws.subscribe('chart.release.statistics').pipe(
    map((event) => {
      return event.fields.reduce((acc, { id, stats }) => {
        acc[id] = stats;
        return acc;
      }, {} as Record<string, ChartReleaseStats>);
    }),
  );
  readonly refreshInterval$ = timer(0, 5000);
  private readonly triggerRefreshSystemInfo$ = new Subject<void>();

  readonly backups$ = forkJoin([
    this.ws.call('replication.query'),
    this.ws.call('rsynctask.query'),
    this.ws.call('cloudsync.query'),
  ]).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly systemInfo$ = this.ws.call('webui.main.dashboard.sys_info').pipe(
    repeat({ delay: () => this.triggerRefreshSystemInfo$ }),
    debounceTime(300),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly networkInterfaces$ = this.ws.call('interface.query').pipe(
    map((interfaces) => processNetworkInterfaces(interfaces)),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly installedApps$ = this.ws.call('chart.release.query', [
    [], { extra: { history: true, stats: true } },
  ]).pipe(
    toLoadingState(),
  );

  readonly pools$ = this.ws.callAndSubscribe('pool.query');

  readonly volumesData$ = this.pools$.pipe(
    switchMap(() => this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }])),
    map((datasets) => this.parseVolumeData(datasets)),
  );

  readonly updateAvailable$ = this.ws.call('update.check_available').pipe(
    map((update) => update.status === SystemUpdateStatus.Available),
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

        return this.ws.call('reporting.netdata_get_data', [[{ name: 'cpu' }], { end, start }]);
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
        return this.ws.call('reporting.netdata_get_data', [[{
          identifier: interfaceName,
          name: 'interface',
        }], { end, start }]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getPoolById(poolId: number): Observable<Pool> {
    return this.ws.call('pool.query', [[['id', '=', +poolId]]]).pipe(
      map((pools) => pools[0]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDatasetById(datasetId: string): Observable<Dataset> {
    return this.ws.call('pool.dataset.query', [[['id', '=', datasetId]]]).pipe(
      map((response) => response[0]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDisksByPoolId(poolId: string): Observable<Disk[]> {
    return this.ws.call('disk.query', [[], { extra: { pools: true } }]).pipe(
      map((response) => response.filter((disk: Disk) => disk.pool === poolId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getApp(appName: string): Observable<App> {
    return this.ws.call(
      'chart.release.query',
      [
        [['name', '=', appName]],
        { extra: { history: true, stats: true } },
      ],
    ).pipe(
      map((apps) => {
        if (apps.length === 0) {
          throw new Error(`App «${appName}» not found. Configure widget to choose another app.`);
        }
        return apps[0];
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getAppStats(appName: string): Observable<ChartReleaseStats> {
    return this.appStatsUpdates$.pipe(
      filter((stats) => Boolean(appName && stats[appName])),
      map((stats) => stats[appName]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
  ) {}

  private parseVolumeData(datasets: Dataset[]): VolumesData {
    const volumesData = new Map<string, VolumeData>();

    datasets.forEach((dataset) => {
      if (typeof dataset === undefined || !dataset) {
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
