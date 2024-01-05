import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, combineLatest, filter } from 'rxjs';
import { AppState } from 'app/store';
import { waitForSystemInfo, selectSystemHostId, selectSystemIsStable } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class SentryService {
  sessionId$ = new BehaviorSubject<string>(UUID.UUID());

  constructor(private store$: Store<AppState>) {}

  init(): void {
    combineLatest([
      this.store$.select(selectSystemIsStable).pipe(filter(Boolean)),
      this.store$.pipe(waitForSystemInfo),
      this.store$.select(selectSystemHostId).pipe(filter(Boolean)),
      this.sessionId$,
    ]).subscribe(([isStable, sysInfo, hostId, sessionId]) => {
      if (!isStable) {
        Sentry.init({
          dsn: environment.sentryPublicDsn,
          release: sysInfo.version,
        });
        Sentry.configureScope((scope) => {
          scope.setTag('session_id', sessionId);
          scope.setTag('host_id', hostId);
        });
      } else {
        Sentry.init({
          enabled: false,
        });
      }
    });
  }
}
