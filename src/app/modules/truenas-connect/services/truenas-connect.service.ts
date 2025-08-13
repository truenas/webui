import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  filter, map, merge, Observable, switchMap, tap,
} from 'rxjs';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

  config = signal<TruenasConnectConfig | null>(null);
  config$ = toObservable(this.config);
  constructor() {
    this.getConfig();
  }

  getConfig(): void {
    merge(
      this.api.call('tn_connect.config'),
      this.api.subscribe('tn_connect.config').pipe(
        map((event) => event.fields),
        filter(Boolean),
      ),
    )
      .subscribe((config) => {
        this.config.set(config);
      });
  }

  disableService(): Observable<TruenasConnectConfig> {
    if (!this.config()) {
      throw new Error('Truenas Connect config is not available');
    }
    return this.api.call('tn_connect.update', [{ enabled: false }])
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  enableService(): Observable<TruenasConnectConfig> {
    if (!this.config()) {
      throw new Error('Truenas Connect config is not available');
    }
    return this.api.call('tn_connect.update', [{ enabled: true }])
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
            filter((config: TruenasConnectConfig) => config.status === TruenasConnectStatus.Configured),
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
    } else {
      // Tab is still open - just focus it without navigation/reload
      // Use empty URL to focus only, no reload
      const existingWindow = this.window.open('', truenasTabName);
      if (existingWindow && !existingWindow.closed) {
        existingWindow.focus();
        globalTruenasConnectWindow = existingWindow; // Update reference
      } else {
        // Window reference was stale, open new one
        const windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
        globalTruenasConnectWindow = this.window.open(url, truenasTabName, windowFeatures);
        if (globalTruenasConnectWindow) {
          globalTruenasConnectWindow.focus();
        }
      }
    }
  }
}
