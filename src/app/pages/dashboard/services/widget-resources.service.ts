import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { sub } from 'date-fns';
import { Observable, forkJoin, timer } from 'rxjs';
import {
  combineLatestWith,
  map, shareReplay, switchMap,
} from 'rxjs/operators';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { ReportingData } from 'app/interfaces/reporting.interface';
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
  readonly refreshInteval$ = timer(0, 10000);

  readonly backups$ = forkJoin([
    this.ws.call('replication.query'),
    this.ws.call('rsynctask.query'),
    this.ws.call('cloudsync.query'),
  ]).pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly systemInfo$ = this.ws.call('webui.main.dashboard.sys_info').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly networkInterfaces$ = this.ws.call('interface.query').pipe(
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly updateAvailable$ = this.ws.call('update.check_available').pipe(
    map((update) => update.status === SystemUpdateStatus.Available),
    toLoadingState(),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  readonly serverTime$ = this.store$.pipe(
    waitForSystemInfo,
    map((systemInfo) => new Date(systemInfo.datetime.$date)),
    combineLatestWith(this.refreshInteval$),
    map(([serverTime]) => {
      serverTime.setSeconds(serverTime.getSeconds() + 10000 / 1000);
      return serverTime;
    }),
  );

  networkInterfaceUpdate(interfaceName: string): Observable<ReportingData[]> {
    return this.serverTime$.pipe(
      switchMap((serverTime) => {
        return this.ws.call('reporting.netdata_get_data', [[{
          identifier: interfaceName,
          name: 'interface',
        }], {
          end: Math.floor(serverTime.getTime() / 1000),
          start: Math.floor(sub(serverTime, { hours: 1 }).getTime() / 1000),
        }]);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
  ) {}
}
