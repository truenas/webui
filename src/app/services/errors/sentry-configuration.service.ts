import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from 'app/store';
import { selectIsEnterprise, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Injectable({
  providedIn: 'root',
})
export class SentryConfigurationService {
  private store$ = inject<Store<AppState>>(Store);

  sessionId$ = new BehaviorSubject<string>(uuidv4());

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
