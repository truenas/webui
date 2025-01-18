import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { switchMap, timer } from 'rxjs';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({
  providedIn: 'root',
})
export class TruenasConnectService {
  config = signal<TruenasConnectConfig>(null);
  config$ = toObservable(this.config);
  constructor(private api: ApiService) {
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
}
