import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class SentryService {
  sessionId$ = new BehaviorSubject<string>(UUID.UUID());

  constructor(
    private store$: Store<AppState>,
  ) {}

  init(): void {
    if (!environment.production) {
      return;
    }

    combineLatest([
      this.store$.pipe(waitForSystemInfo),
      this.sessionId$,
    ]).subscribe(([sysInfo, sessionId]) => {
      Sentry.init({
        dsn: environment.sentryPublicDsn,
        release: sysInfo.version,
      });
      Sentry.configureScope((scope) => {
        scope.setTag('session_id', sessionId);
      });
    });
  }
}
