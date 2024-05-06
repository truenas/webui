import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { sub } from 'date-fns';
import { Observable, timer } from 'rxjs';
import {
  combineLatestWith,
  map, shareReplay, skipWhile, switchMap,
} from 'rxjs/operators';
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

  readonly systemInfo$ = this.ws.call('webui.main.dashboard.sys_info').pipe(
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly networkInterfaces$ = this.ws.call('interface.query').pipe(
    toLoadingState(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly serverTime$ = this.store$.pipe(
    waitForSystemInfo,
    map((systemInfo) => new Date(systemInfo.datetime.$date)),
    combineLatestWith(timer(0, 10000)),
    map(([serverTime]) => {
      serverTime.setSeconds(serverTime.getSeconds() + 10000 / 1000);
      return serverTime;
    }),
  );

  networkInterfaceUpdate(interfaceName: string): Observable<ReportingData[]> {
    return this.serverTime$.pipe(
      skipWhile(() => !interfaceName),
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
