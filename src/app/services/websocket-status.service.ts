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
  private readonly authStatus$ = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.authStatus$.asObservable();
  get isAuthenticated(): boolean {
    return this.authStatus$.getValue();
  }

  readonly isActiveSession$ = combineLatest([
    this.connectionEstablished$,
    this.isLoggedIn$.asObservable(),
  ]).pipe(
    map(([isConnected, isLoggedIn]) => isConnected && isLoggedIn),
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
