import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject, combineLatest,
  map,
  tap,
} from 'rxjs';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class WebSocketStatusService {
  private readonly connectionEstablished$ = new BehaviorSubject(false);
  readonly isConnected$ = this.connectionEstablished$.asObservable();

  get isConnected(): boolean {
    return this.connectionEstablished$.getValue();
  }

  readonly isReconnectAllowed$ = new BehaviorSubject<boolean>(false);
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
    this.isActiveSession$.pipe(untilDestroyed(this)).subscribe();
  }

  setLoginStatus(isLoggedIn: boolean): void {
    this.isLoggedIn$.next(isLoggedIn);
  }

  setConnectionStatus(connected: boolean): void {
    this.connectionEstablished$.next(connected);
  }

  setReconnect(status: boolean): void {
    this.isReconnectAllowed$.next(status);
  }
}
