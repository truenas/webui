import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from 'app/modules/auth/auth.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { waitForWebSocketReconnect } from 'app/pages/system-tasks/utils/wait-for-websocket-reconnect';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Injectable({ providedIn: 'root' })
export class SystemTaskRedirectService {
  private wsStatus = inject(WebSocketStatusService);
  private loader = inject(LoaderService);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Shared tail of the tasks that take the system down and expect it back: keep the loader up
   * until the middleware answers again, then drop the now stale token and return to sign-in.
   *
   * `destroyRef` is passed in because this is called from a job callback, outside of an
   * injection context.
   */
  goToSigninWhenSystemIsBack(destroyRef: DestroyRef): void {
    waitForWebSocketReconnect(this.wsStatus)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.loader.close();
        this.authService.clearAuthToken();
        this.router.navigate(['/signin']);
      });
  }
}
