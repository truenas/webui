import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import {
  filter, map, merge, Observable, switchMap, tap,
} from 'rxjs';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

// Global reference to persist across potential service reinstantiation
let globalTruenasConnectWindow: Window | null = null;

// Export function to reset global state for testing
export function resetGlobalTruenasConnectWindow(): void {
  globalTruenasConnectWindow = null;
}

@Injectable({
  providedIn: 'root',
})
export class TruenasConnectService {
  private window = inject<Window>(WINDOW);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private wsStatus = inject(WebSocketStatusService);

  /**
   * observable which calls and subscribes to `tn_connect.config` and survives websocket
   * disconnects due to webui restarts.
   */
  config$: Observable<TruenasConnectConfig> = this.wsStatus.isAuthenticated$.pipe(
    // only do *anything* once we're authenticated
    filter((isAuthenticated: boolean) => isAuthenticated),
    switchMap(() => {
      // on authentication, we assume the websocket just now connected and we re-subscribe
      // to the API call, since it probably died. (or is first being established)
      //
      // this prevents behavior where the subscription goes stale and doesn't emit after
      // the webui is restarted due to the truenas connect state changing from enabled -> disabled
      // or vice-versa
      return merge(
        this.api.call('tn_connect.config'),
        this.api.subscribe('tn_connect.config').pipe(
          map((event) => event.fields),
          filter(Boolean),
        ),
      );
    }),
  );

  /**
   * signal derived directly from `config$`. will be `undefined` until first
   * connection is established.
   */
  config = toSignal(this.config$, { initialValue: undefined });

  disableService(): Observable<TruenasConnectConfig> {
    return this.api.call('tn_connect.update', [{
      enabled: false,
    }])
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  enableService(): Observable<TruenasConnectConfig> {
    return this.api.call('tn_connect.update', [{
      enabled: true,
    }])
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  connect(): Observable<TruenasConnectConfig> {
    return this.api.call('tn_connect.get_registration_uri')
      .pipe(
        tap((url) => {
          this.openTruenasConnectWindow(url);
        }),
        switchMap(() => {
          return this.config$.pipe(
            filter((config): config is TruenasConnectConfig => config?.status === TruenasConnectStatus.Configured),
          );
        }),
        this.errorHandler.withErrorHandler(),
      );
  }

  generateToken(): Observable<string> {
    return this.api.call('tn_connect.generate_claim_token')
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  openTruenasConnectWindow(url: string): void {
    const truenasTabName = 'TrueNASConnect';

    if (!globalTruenasConnectWindow || globalTruenasConnectWindow.closed) {
      // First time, or the old tab was closed - open new window with URL
      const windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
      globalTruenasConnectWindow = this.window.open(url, truenasTabName, windowFeatures);

      if (globalTruenasConnectWindow) {
        globalTruenasConnectWindow.focus();
      }
      return;
    }

    // Tab is still open - just focus it without navigation/reload
    // Use empty URL to focus only, no reload
    const existingWindow = this.window.open('', truenasTabName);
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      globalTruenasConnectWindow = existingWindow; // Update reference
      return;
    }

    // Window reference was stale, open new one
    const windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
    globalTruenasConnectWindow = this.window.open(url, truenasTabName, windowFeatures);
    if (globalTruenasConnectWindow) {
      globalTruenasConnectWindow.focus();
    }
  }

  openStatusModal(): void {
    this.matDialog.open(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: {
        top: '48px',
        right: '16px',
      },
    });
  }
}
