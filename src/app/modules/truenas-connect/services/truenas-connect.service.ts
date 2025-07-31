import { Inject, Injectable, signal } from '@angular/core';
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
  config = signal<TruenasConnectConfig | null>(null);
  config$ = toObservable(this.config);
  constructor(
    @Inject(WINDOW) private window: Window,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
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
