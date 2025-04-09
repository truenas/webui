import { Inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  filter, map, merge, Observable, switchMap, tap,
} from 'rxjs';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig, TruenasConnectUpdate } from 'app/interfaces/truenas-connect-config.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class TruenasConnectService {
  config = signal<TruenasConnectConfig | null>(null);
  config$ = toObservable(this.config);
  constructor(
    @Inject(WINDOW) private window: Window,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: LoaderService,
  ) {
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

    const payload = {
      ips: this.config().ips,
      enabled: false,
      tnc_base_url: this.config().tnc_base_url,
      account_service_base_url: this.config().account_service_base_url,
      leca_service_base_url: this.config().leca_service_base_url,
      heartbeat_url: this.config().heartbeat_url,
    };
    return this.api.call('tn_connect.update', [payload])
      .pipe(
        this.loader.withLoader(),
        switchMap(() => {
          return this.config$.pipe(
            filter((configRes: TruenasConnectConfig) => configRes.status === TruenasConnectStatus.Disabled),
          );
        }),
        this.errorHandler.withErrorHandler(),
      );
  }

  enableService(config?: TruenasConnectUpdate): Observable<TruenasConnectConfig> {
    const payload = {
      ips: this.config().ips,
      enabled: true,
      tnc_base_url: this.config().tnc_base_url,
      account_service_base_url: this.config().account_service_base_url,
      leca_service_base_url: this.config().leca_service_base_url,
      heartbeat_url: this.config().heartbeat_url,
      ...(config || {}),
    };
    return this.api.call('tn_connect.update', [{
      ...payload,
      enabled: true,
    }])
      .pipe(
        this.loader.withLoader(),
        filter((configRes) => {
          return configRes.status === TruenasConnectStatus.ClaimTokenMissing;
        }),
        switchMap(() => {
          return this.api.call('tn_connect.generate_claim_token');
        }),
        switchMap(() => {
          return this.config$.pipe(
            filter((configRes: TruenasConnectConfig) => {
              return configRes.status === TruenasConnectStatus.RegistrationFinalizationWaiting;
            }),
          );
        }),
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
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
      );
  }

  generateToken(): Observable<string> {
    return this.api.call('tn_connect.generate_claim_token')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
      );
  }
}
