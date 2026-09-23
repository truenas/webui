import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  debounceTime,
  filter, map, Observable, switchMap, tap,
} from 'rxjs';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

@Injectable({
  providedIn: 'root',
})
export class TokenLastUsedService {
  private wsHandler = inject(WebSocketHandlerService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  private tokenLastUsed$ = new BehaviorSubject<string | null>(this.window.localStorage.getItem('tokenLastUsed'));
  private readonly defaultLifetimeSeconds = 300; // 5 minutes default
  private tokenLifetime$ = new BehaviorSubject<number>(this.getStoredLifetime());

  /**
   * The configured session timeout, seeded from storage so that a page load knows it before
   * preferences have been read back from the server. `AuthService` renews the authentication
   * token against this, which keeps the token a refresh spends as long-lived as the session it
   * belongs to.
   */
  get lifetime$(): Observable<number> {
    return this.tokenLifetime$.asObservable();
  }

  /**
   * Check if token was used within the configured session timeout
  */
  get isTokenWithinTimeline$(): Observable<boolean> {
    return this.tokenLastUsed$.pipe(
      map((tokenLastUsed) => {
        if (!tokenLastUsed) {
          return false;
        }

        const tokenRecentUsageLifetime = this.getStoredLifetime() * 1000;
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
    this.tokenLifetime$.next(lifetimeSeconds);
  }

  setupTokenLastUsedValue(user$: Observable<LoggedInUser | null>): void {
    user$.pipe(
      filter(Boolean),
      tapOnce(() => this.updateTokenLastUsed()),
      switchMap(() => this.wsHandler.responses$.pipe(debounceTime(5000))),
      tap(() => this.updateTokenLastUsed()),
      takeUntilDestroyed(this.destroyRef),
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
    this.tokenLifetime$.next(this.defaultLifetimeSeconds);
  }

  private getStoredLifetime(): number {
    const storedLifetime = Number(this.window.localStorage.getItem('tokenLifetime'));
    return storedLifetime > 0 ? storedLifetime : this.defaultLifetimeSeconds;
  }
}
