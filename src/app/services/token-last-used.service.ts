import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  auditTime,
  BehaviorSubject,
  filter, map, Observable, switchMap, tap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { TYPED_API_CLIENT } from 'app/modules/websocket/typed-api/typed-api-client.token';

@Injectable({
  providedIn: 'root',
})
export class TokenLastUsedService {
  private client$ = inject(TYPED_API_CLIENT);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  private tokenLastUsed$ = new BehaviorSubject<string | null>(this.window.localStorage.getItem('tokenLastUsed'));
  private readonly defaultLifetimeSeconds = 300; // 5 minutes default
  private readonly stampIntervalMs = 5000;
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
      // On every signed-in user, not just the first: after `clearTokenLastUsed()` this is the
      // only thing that starts a stamp again.
      tap(() => this.updateTokenLastUsed()),
      // `auditTime`, not `debounceTime`. A socket that never falls quiet for five seconds — the
      // dashboard streams reporting data continuously — never lets a debounce emit at all, so the
      // stamp froze at sign-in on exactly the pages that are busiest, and the sign-in page then
      // read the session as expired however long the user had been working in it. Auditing stamps
      // at most once per interval whether the traffic is a trickle or a stream.
      switchMap(() => this.client$.pipe(
        switchMap((client) => client.connection.messages()),
        auditTime(this.stampIntervalMs),
      )),
      // Traffic keeps a stamp fresh but never starts one. The socket keeps answering after the
      // token is cleared — a failover's sign-in page refusing the old token, for one — and a
      // stamp then made the sign-in page read a session that no longer exists as being restored:
      // it swapped its form for "Logging in..." and dropped the login the user had just sent.
      filter(() => this.tokenLastUsed$.value !== null),
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
