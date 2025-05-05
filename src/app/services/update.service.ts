import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalApiHttpService } from 'app/services/global-api-http.service';

@Injectable({
  providedIn: 'root',
})
export class UpdateService {
  private lastSeenBootId: string;

  constructor(
    private globalApi: GlobalApiHttpService,
    @Inject(WINDOW) private window: Window,
  ) {}

  /**
   * Hard refresh is needed to load new html and js after the update.
   */
  hardRefreshIfNeeded(): Observable<string> {
    return this.globalApi.getBootId().pipe(
      tap((bootId) => {
        if (!this.lastSeenBootId) {
          this.lastSeenBootId = bootId;
          return;
        }

        if (this.lastSeenBootId !== bootId) {
          this.window.location.reload();
        }
      }),
    );
  }
}
