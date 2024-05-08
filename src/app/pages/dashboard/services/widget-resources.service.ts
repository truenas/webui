import { Injectable } from '@angular/core';
import { map, shareReplay } from 'rxjs/operators';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WebSocketService } from 'app/services/ws.service';

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

  readonly updateAvailable$ = this.ws.call('update.check_available').pipe(
    map((update) => update.status === SystemUpdateStatus.Available),
    toLoadingState(),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  constructor(
    private ws: WebSocketService,
  ) {}
}
