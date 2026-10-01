import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { CallResponse } from '@truenas/api-client';
import { subHours } from 'date-fns';
import {
  Observable, OperatorFunction, Subject, catchError, debounceTime,
  filter,
  forkJoin, map, NEVER, of, repeat, shareReplay, startWith, throttleTime, timer,
} from 'rxjs';
import { detectStaleData, StaleDataState } from 'app/helpers/operators/detect-stale-data.operator';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { poolScanFromEvent } from 'app/helpers/pool-scan-event.helper';
import { App, AppStartQueryParams, AppStats } from 'app/interfaces/app.interface';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { Job } from 'app/interfaces/job.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import {
  AllCpusUpdate, MemoryUpdate, AllNetworkInterfacesUpdate, ReportingData,
} from 'app/interfaces/reporting.interface';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { DashboardSystemInfo } from 'app/interfaces/system-info.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { processNetworkInterfaces } from 'app/pages/dashboard/widgets/network/widget-interface/widget-interface.utils';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

type DashboardSystemInfoResult = CallResponse<WebUiApiDirectory, 'webui.main.dashboard.sys_info'>;

/**
 * Middleware types the license as an open dictionary and `datetime` as a string, but they are the
 * `License` that `truenas.license.info` returns and an `ApiTimestamp` envelope (gap 15).
 */
function toDashboardSystemInfo(info: DashboardSystemInfoResult): DashboardSystemInfo {
  return info as unknown as DashboardSystemInfo;
}

/**
 * Narrows generated rows to the UI interface the widgets are written against. Both describe the
 * same wire objects, but the UI's read open strings through its enums (`DiskPowerLevel`,
 * `CompressionType`, `PoolStatus`), require fields middleware defaults, and still list a few it no
 * longer sends (`Pool.encrypt*`). Those interfaces are shared far beyond the dashboard, so they
 * are reconciled with their other readers rather than here.
 */
function asUiInterface<T>(): OperatorFunction<unknown, T> {
  return map((value) => value as T);
}

export interface PoolUsage {
  available: number;
  used: number;
  total: number;
}

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
  private api = inject(TypedApiService);
  /**
   * For the two event sources the typed client cannot subscribe to: `reporting.realtime` and
   * `app.stats` take subscription params, so they are not typed event names (gap 5 in
   * docs/devs/typed-api-client.md).
   */
  private legacyApi = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);

  readonly realtimeUpdates$ = this.legacyApi.subscribe('reporting.realtime');

  readonly refreshInterval$ = timer(0, 5000).pipe(startWith(0));
  private readonly triggerRefreshDashboardSystemInfo$ = new Subject<void>();

  readonly backups$ = forkJoin([
    this.api.query('replication.query'),
    this.api.query('rsynctask.query'),
    this.api.query('cloudsync.query'),
    this.api.query('cloud_backup.query'),
  ]).pipe(
    asUiInterface<[ReplicationTask[], RsyncTask[], CloudSyncTask[], CloudBackup[]]>(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly dashboardSystemInfo$ = this.api.call('webui.main.dashboard.sys_info').pipe(
    map((info) => toDashboardSystemInfo(info)),
    repeat({ delay: () => this.triggerRefreshDashboardSystemInfo$ }),
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

  readonly networkInterfaces$ = this.api.query('interface.query').pipe(
    asUiInterface<NetworkInterface[]>(),
    map((interfaces) => processNetworkInterfaces(interfaces)),
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly installedApps$ = this.api.queryAndSubscribe('app.query').pipe(
    asUiInterface<App[]>(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly pools$ = this.api.queryAndSubscribe('pool.query').pipe(
    asUiInterface<Pool[]>(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // since pool.query doesn't emit events for scan updates, we need to subscribe to
  // the `pool.scan` endpoint to actually receive real-time scrub/resilver updates.
  readonly scans$ = this.api.subscribe('pool.scan').pipe(
    map((event) => poolScanFromEvent(event)),
    filter((scan) => scan !== null),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly updateAvailable$ = this.api.call('update.status').pipe(
    map((updateStatus) => Boolean(updateStatus.status?.new_version)),
    catchError(() => of(false)),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  networkInterfaceLastHourStats(interfaceName: string): Observable<ReportingData[]> {
    const now = new Date();
    now.setSeconds(now.getSeconds() + 5);

    const end = Math.floor(now.getTime() / 1000);
    const start = Math.floor(subHours(now, 1).getTime() / 1000);

    return this.api.call('reporting.netdata_get_data', [[{
      identifier: interfaceName,
      name: 'interface',
    }], { end, start }]).pipe(
      asUiInterface<ReportingData[]>(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getPoolById(poolId: string): Observable<Pool | undefined> {
    return this.pools$.pipe(
      map((pools) => pools.find((pool) => pool.id === +poolId || pool.name === poolId)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getPoolByName(poolName: string): Observable<Pool> {
    return this.api.query('pool.query', [['name', '=', poolName]]).pipe(
      asUiInterface<Pool[]>(),
      map((pools) => pools[0]),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getDisksByPoolId(poolId: string): Observable<Disk[]> {
    return this.api.query('disk.query', [], { extra: { pools: true } }).pipe(
      asUiInterface<Disk[]>(),
      map((disks) => disks.filter((disk) => disk.pool === poolId)),
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
    return this.legacyApi.subscribe('app.stats').pipe(
      filter(() => Boolean(appName)),
      map((event) => event.fields.find((stats) => stats.app_name === appName)),
      filter((stats) => !!stats),
      throttleTime(500),
      toLoadingState(),
    );
  }

  getAppStatusUpdates(appName: string): Observable<Job<void, AppStartQueryParams>> {
    return this.api.subscribe('core.get_jobs').pipe(
      filter((event) => event.msg === 'added' || event.msg === 'changed'),
      map((event) => event.fields),
      filter((job) => ['app.start', 'app.stop'].includes(job.method) && job.arguments[0] === appName),
      // The client's job is honest about the fields that stay null until the job starts (gap 8).
      map((job) => job as unknown as Job<void, AppStartQueryParams>),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  refreshDashboardSystemInfo(): void {
    this.triggerRefreshDashboardSystemInfo$.next();
  }

  /**
   * Returns CPU data with stale detection.
   * Data is considered stale if no updates received within 5 seconds.
   * Errors in the stream are caught and the observable completes silently.
   */
  cpuUpdatesWithStaleDetection(): Observable<StaleDataState<AllCpusUpdate>> {
    return this.realtimeUpdates$.pipe(
      map((update) => update.fields.cpu),
      catchError(() => NEVER),
      detectStaleData(5000),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Returns memory data with stale detection.
   * Data is considered stale if no updates received within 5 seconds.
   * Errors in the stream are caught and the observable completes silently.
   */
  memoryUpdatesWithStaleDetection(): Observable<StaleDataState<MemoryUpdate>> {
    return this.realtimeUpdates$.pipe(
      map((update) => update.fields.memory),
      catchError(() => NEVER),
      detectStaleData(5000),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Returns network interface data with stale detection.
   * Data is considered stale if no updates received within 5 seconds.
   * Errors in the stream are caught and the observable completes silently.
   */
  networkInterfaceUpdatesWithStaleDetection(): Observable<StaleDataState<AllNetworkInterfacesUpdate>> {
    return this.realtimeUpdates$.pipe(
      map((update) => update.fields.interfaces),
      catchError(() => NEVER),
      detectStaleData(5000),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Returns pool data with stale detection.
   * Data is considered stale if no updates received within 5 seconds.
   * Errors in the stream are caught and the observable completes silently.
   */
  poolUpdatesWithStaleDetection(): Observable<StaleDataState<Record<string, PoolUsage>>> {
    return this.realtimeUpdates$.pipe(
      map((update) => update.fields.pools),
      catchError(() => NEVER),
      detectStaleData(5000),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  /**
   * Returns scan data with stale detection.
   * Data is considered stale if no updates received within 5 seconds.
   * Errors in the stream are caught and the observable completes silently.
   */
  scanUpdatesWithStaleDetection(): Observable<StaleDataState<PoolScan>> {
    return this.scans$.pipe(
      catchError(() => NEVER),
      detectStaleData(5000),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
