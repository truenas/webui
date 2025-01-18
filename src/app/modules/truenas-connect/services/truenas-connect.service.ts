import { Inject, Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  filter, Observable, switchMap, tap, timer,
} from 'rxjs';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig, TruenasConnectUpdate } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class TruenasConnectService {
  config = signal<TruenasConnectConfig>(null);
  config$ = toObservable(this.config);
  constructor(@Inject(WINDOW) private window: Window, private api: ApiService) {
    this.getConfig();
  }

  getConfig(): void {
    timer(0, 5000)
      .pipe(
        switchMap(() => {
          return this.api.call('tn_connect.config');
        }),
      )
      .subscribe((config) => {
        this.config.set(config);
      });
  }

  disableService(): Observable<TruenasConnectConfig> {
    const payload = {
      ips: this.config().ips,
      enabled: false,
      tnc_base_url: this.config().tnc_base_url,
      account_service_base_url: this.config().account_service_base_url,
      leca_service_base_url: this.config().leca_service_base_url,
    };
    return this.api.call('tn_connect.update', [payload])
      .pipe(
        switchMap(() => {
          return this.config$.pipe(
            filter((configRes: TruenasConnectConfig) => configRes.status === TruenasConnectStatus.Disabled),
          );
        }),
      );
  }

  enableService(payload: TruenasConnectUpdate): Observable<TruenasConnectConfig> {
    return this.api.call('tn_connect.update', [{
      ...payload,
      enabled: true,
    }])
      .pipe(
        filter((config) => {
          return config.status === TruenasConnectStatus.ClaimTokenMissing;
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
      );
  }

  generateToken(): Observable<string> {
    return this.api.call('tn_connect.generate_claim_token');
  }
}
