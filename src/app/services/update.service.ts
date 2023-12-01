import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private lastSeenBuiltTime: number;

  constructor(
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) {}

  /**
   * Hard refresh is needed to load new html and js after the update.
   */
  hardRefreshIfNeeded(): Observable<unknown> {
    return this.ws.call('system.build_time').pipe(
      tap((buildTime: ApiTimestamp) => {
        if (!this.lastSeenBuiltTime) {
          // First boot.
          this.lastSeenBuiltTime = buildTime.$date;
          return;
        }

        if (this.lastSeenBuiltTime === buildTime.$date) {
          // No update.
          return;
        }

        this.window.location.reload();
      }),
    );
  }
}
