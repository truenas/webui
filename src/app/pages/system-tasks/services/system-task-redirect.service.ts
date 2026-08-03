import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthService } from 'app/modules/auth/auth.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { waitForWebSocketReconnect } from 'app/pages/system-tasks/utils/wait-for-websocket-reconnect';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@Injectable({ providedIn: 'root' })
export class SystemTaskRedirectService {
  private wsStatus = inject(WebSocketStatusService);
  private wsManager = inject(WebSocketHandlerService);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Shared tail of the tasks that take the system down and expect it back: stay on the splash
   * until the middleware answers again, then drop the now stale token and return to sign-in.
   * Callers must have called `prepareShutdown()` first - that is what tells the wait apart
   * from the connection the task started on.
   *
   * `destroyRef` is passed in because this is called from a job callback, outside of an
   * injection context.
   */
  goToSigninWhenSystemIsBack(destroyRef: DestroyRef): void {
    waitForWebSocketReconnect(this.wsStatus, this.wsManager)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        this.authService.clearAuthToken();
        this.router.navigate(['/signin']);
      });
  }
}
