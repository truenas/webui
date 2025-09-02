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

  private validateNetworkConfig(ips: string[], interfaces: string[], useAllInterfaces: boolean): boolean {
    // If no specific IPs or interfaces are configured, must use all interfaces
    if (ips.length === 0 && interfaces.length === 0) {
      return true; // Force use_all_interfaces to true
    }
    return useAllInterfaces;
  }

  disableService(): Observable<TruenasConnectConfig> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('Truenas Connect config is not available');
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

  enableService(): Observable<TruenasConnectConfig> {
    const currentConfig = this.config();
    if (!currentConfig) {
      throw new Error('Truenas Connect config is not available');
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

  connect(): Observable<TruenasConnectConfig> {
    return this.api.call('tn_connect.get_registration_uri')
      .pipe(
        tap((url) => {
          this.window.open(url);
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
}
