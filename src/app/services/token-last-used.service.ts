import { Inject, Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject,
  debounceTime,
  filter, map, Observable, switchMap, tap,
} from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLastUsedService {
  private tokenLastUsed$ = new BehaviorSubject<string | null>(this.window.localStorage.getItem('tokenLastUsed'));

  /**
   * Check if token was used no more than 5 minutes ago (default)
  */
  get isTokenWithinTimeline$(): Observable<boolean> {
    return this.tokenLastUsed$.pipe(
      map((tokenLastUsed) => {
        if (!tokenLastUsed) {
          return false;
        }

        const tokenRecentUsageLifetime = 5 * oneMinuteMillis;
        const tokenLastUsedTime = new Date(tokenLastUsed).getTime();
        const currentTime = Date.now();

        return currentTime - tokenLastUsedTime <= tokenRecentUsageLifetime;
      }),
    );
  }

  constructor(
    private wsHandler: WebSocketHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {
  }

  setupTokenLastUsedValue(user$: Observable<LoggedInUser | null>): void {
    user$.pipe(
      filter(Boolean),
      tapOnce(() => this.updateTokenLastUsed()),
      switchMap(() => this.wsHandler.responses$.pipe(debounceTime(5000))),
      tap(() => this.updateTokenLastUsed()),
      untilDestroyed(this),
    ).subscribe();
  }

  updateTokenLastUsed(): void {
    const tokenLastUsed = new Date().toISOString();
    this.window.localStorage.setItem('tokenLastUsed', tokenLastUsed);
    this.tokenLastUsed$.next(tokenLastUsed);
  }

  clearTokenLastUsed(): void {
    this.tokenLastUsed$.next(null);
    this.window.localStorage.removeItem('tokenLastUsed');
  }
}
