import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject, combineLatest,
  map,
  tap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketStatusService {
  private destroyRef = inject(DestroyRef);

  private readonly connectionEstablished$ = new BehaviorSubject(false);
  readonly isConnected$ = this.connectionEstablished$.asObservable();

  get isConnected(): boolean {
    return this.connectionEstablished$.getValue();
  }

  readonly isReconnectAllowed$ = new BehaviorSubject<boolean>(false);
  readonly isFailoverRestart$ = new BehaviorSubject<boolean>(false);
  private readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);

  /**
   * Whether the app's session is authenticated, projected from the typed client's
   * `authenticator.authenticated$`, since an open socket says nothing about a sign-in. `ApiService`
   * pushes it in, so this root service's many consumers and specs don't drag in a real client.
   */
  private readonly sessionEstablished$ = new BehaviorSubject<boolean>(false);
  readonly isSessionEstablished$ = this.sessionEstablished$.asObservable();

  private readonly authStatus$ = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.authStatus$.asObservable();
  get isAuthenticated(): boolean {
    return this.authStatus$.getValue();
  }

  /**
   * An authenticated typed session that the sign-in flow has finished setting
   * up. The second half is what keeps the app from counting itself logged in
   * between `auth.login_ex` succeeding and the failover checks and session
   * initialization that follow it.
   */
  readonly isActiveSession$ = combineLatest([
    this.isSessionEstablished$,
    this.isLoggedIn$.asObservable(),
  ]).pipe(
    map(([isSessionEstablished, isLoggedIn]) => isSessionEstablished && isLoggedIn),
    tap((status) => {
      this.authStatus$.next(status);
    }),
  );

  constructor() {
    this.isActiveSession$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  setLoginStatus(isLoggedIn: boolean): void {
    this.isLoggedIn$.next(isLoggedIn);
  }

  /** Called by `ApiService` for every change in the typed session's state. */
  setSessionStatus(isSessionEstablished: boolean): void {
    this.sessionEstablished$.next(isSessionEstablished);
  }

  setConnectionStatus(connected: boolean): void {
    this.connectionEstablished$.next(connected);
  }

  setReconnectAllowed(status: boolean): void {
    this.isReconnectAllowed$.next(status);
  }

  setFailoverStatus(status: boolean): void {
    this.isFailoverRestart$.next(status);
  }
}
