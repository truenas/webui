import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { UUID } from 'angular2-uuid';
import { environment } from 'environments/environment';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { AppState } from 'app/store';
import { selectIsEnterprise, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class SentryConfigurationService {
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
      this.store$.select(selectIsEnterprise),
      this.sessionId$,
    ]).subscribe(([sysInfo, isEnterprise, sessionId]) => {
      Sentry.setTag('release', sysInfo.version);
      Sentry.setTag('enterprise', isEnterprise);
      Sentry.setTag('session_id', sessionId);
    });
  }
}
