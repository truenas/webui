import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private lastSeenBootId: string;

  constructor(
    private api: ApiService,
    @Inject(WINDOW) private window: Window,
  ) {}

  /**
   * Hard refresh is needed to load new html and js after the update.
   */
  hardRefreshIfNeeded(): Observable<string> {
    return this.api.call('system.boot_id').pipe(
      tap((bootId) => {
        if (!this.lastSeenBootId) {
          // First boot.
          this.lastSeenBootId = bootId;
          return;
        }

        if (this.lastSeenBootId === bootId) {
          // No update.
          return;
        }

        this.window.location.reload();
      }),
    );
  }
}
