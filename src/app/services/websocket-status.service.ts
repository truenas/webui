import { Injectable } from '@angular/core';
import {
  BehaviorSubject, combineLatest, of, switchMap,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebSocketStatusService {
  private readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);
  private readonly connectionEstablished$ = new BehaviorSubject(false);
  readonly isConnected$ = this.connectionEstablished$.asObservable();

  private syncIsConnected = false;
  get isConnected(): boolean {
    return this.syncIsConnected;
  }

  private syncIsAuthenticated = false;
  get isAuthenticated(): boolean {
    return this.syncIsAuthenticated;
  }

  readonly isAuthenticated$ = combineLatest([
    this.isConnected$,
    this.isLoggedIn$.asObservable(),
  ]).pipe(
    switchMap(([isConnected, isLoggedIn]) => {
      this.syncIsAuthenticated = isConnected && isLoggedIn;
      return of(isConnected && isLoggedIn);
    }),
  );

  setAuthStatus(isLoggedIn: boolean): void {
    this.isLoggedIn$.next(isLoggedIn);
  }

  setConnectionStatus(connected: boolean): void {
    this.syncIsConnected = connected;
    this.connectionEstablished$.next(connected);
  }
}
