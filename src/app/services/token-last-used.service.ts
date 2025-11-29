import { Injectable, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject,
  debounceTime,
  filter, map, Observable, switchMap, tap,
} from 'rxjs';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLastUsedService {
  private wsHandler = inject(WebSocketHandlerService);
  private window = inject<Window>(WINDOW);

  private tokenLastUsed$ = new BehaviorSubject<string | null>(this.window.localStorage.getItem('tokenLastUsed'));
  private readonly defaultLifetimeSeconds = 300; // 5 minutes default

  /**
   * Check if token was used within the configured session timeout
  */
  get isTokenWithinTimeline$(): Observable<boolean> {
    return this.tokenLastUsed$.pipe(
      map((tokenLastUsed) => {
        if (!tokenLastUsed) {
          return false;
        }

        const storedLifetime = this.window.localStorage.getItem('tokenLifetime');
        const lifetimeSeconds = storedLifetime ? Number(storedLifetime) : this.defaultLifetimeSeconds;
        const tokenRecentUsageLifetime = lifetimeSeconds * 1000;
        const tokenLastUsedTime = new Date(tokenLastUsed).getTime();
        const currentTime = Date.now();

        return currentTime - tokenLastUsedTime <= tokenRecentUsageLifetime;
      }),
    );
  }

  /**
   * Update the session lifetime value used for token validation
   */
  updateTokenLifetime(lifetimeSeconds: number): void {
    this.window.localStorage.setItem('tokenLifetime', String(lifetimeSeconds));
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
    this.window.localStorage.removeItem('tokenLifetime');
  }
}
