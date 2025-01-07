import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BehaviorSubject, combineLatest,
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

  private readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);
  private readonly authStatus$ = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.authStatus$.asObservable();
  get isAuthenticated(): boolean {
    return this.authStatus$.getValue();
  }

  constructor() {
    combineLatest([
      this.isConnected$,
      this.isLoggedIn$.asObservable(),
    ]).pipe(
      tap(([isConnected, isLoggedIn]) => this.authStatus$.next(isConnected && isLoggedIn)),
      untilDestroyed(this),
    ).subscribe();
  }

  setLoginStatus(isLoggedIn: boolean): void {
    this.isLoggedIn$.next(isLoggedIn);
  }

  setConnectionStatus(connected: boolean): void {
    this.connectionEstablished$.next(connected);
  }
}
