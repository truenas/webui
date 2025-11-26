import { Injectable, signal, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  filter, map, merge, Observable, switchMap, tap,
} from 'rxjs';
import { HarborosConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { HarborosConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

// Global reference to persist across potential service reinstantiation
let globalHarborosConnectWindow: Window | null = null;

// Export function to reset global state for testing
export function resetGlobalHarborosConnectWindow(): void {
  globalHarborosConnectWindow = null;
}

@Injectable({
  providedIn: 'root',
})
export class HarborosConnectService {
  private window = inject<Window>(WINDOW);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  config = signal<HarborosConnectConfig | null>(null);
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

  private validateNetworkConfig(ips: string[], interfaces: string[], useAllInterfaces: boolean): boolean {
    // If no specific IPs or interfaces are configured, must use all interfaces
    if (ips.length === 0 && interfaces.length === 0) {
      return true; // Force use_all_interfaces to true
    }
    return useAllInterfaces;
  }

  disableService(): Observable<HarborosConnectConfig> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('HarborOS Connect config is not available');
    }
    const ips = currentConfig.ips || [];
    const interfaces = currentConfig.interfaces || [];
    const useAllInterfaces = this.validateNetworkConfig(
      ips,
      interfaces,
      currentConfig.use_all_interfaces ?? true,
    );
    return this.api.call('tn_connect.update', [{
      enabled: false,
      ips,
      interfaces,
      use_all_interfaces: useAllInterfaces,
    }])
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  enableService(): Observable<HarborosConnectConfig> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('HarborOS Connect config is not available');
    }
    const ips = currentConfig.ips || [];
    const interfaces = currentConfig.interfaces || [];
    const useAllInterfaces = this.validateNetworkConfig(
      ips,
      interfaces,
      currentConfig.use_all_interfaces ?? true,
    );
    return this.api.call('tn_connect.update', [{
      enabled: true,
      ips,
      interfaces,
      use_all_interfaces: useAllInterfaces,
    }])
      .pipe(
        this.errorHandler.withErrorHandler(),
      );
  }

  connect(): Observable<HarborosConnectConfig> {
    return this.api.call('tn_connect.get_registration_uri')
      .pipe(
        tap((url) => {
          this.openHarborosConnectWindow(url);
        }),
        switchMap(() => {
          return this.config$.pipe(
            filter((config: HarborosConnectConfig) => config.status === HarborosConnectStatus.Configured),
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

  openHarborosConnectWindow(url: string): void {
    const truenasTabName = 'HarborOSConnect';

    if (!globalHarborosConnectWindow || globalHarborosConnectWindow.closed) {
      // First time, or the old tab was closed - open new window with URL
      const windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
      globalHarborosConnectWindow = this.window.open(url, truenasTabName, windowFeatures);

      if (globalHarborosConnectWindow) {
        globalHarborosConnectWindow.focus();
      }
      return;
    }

    // Tab is still open - just focus it without navigation/reload
    // Use empty URL to focus only, no reload
    const existingWindow = this.window.open('', truenasTabName);
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      globalHarborosConnectWindow = existingWindow; // Update reference
      return;
    }

    // Window reference was stale, open new one
    const windowFeatures = 'menubar=yes,location=yes,resizable=yes,scrollbars=yes,status=yes';
    globalHarborosConnectWindow = this.window.open(url, truenasTabName, windowFeatures);
    if (globalHarborosConnectWindow) {
      globalHarborosConnectWindow.focus();
    }
  }
}
