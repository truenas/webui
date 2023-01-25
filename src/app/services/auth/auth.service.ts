import { Injectable } from '@angular/core';
import { UUID } from 'angular2-uuid';
import {
  BehaviorSubject, filter, map, Observable, take, tap,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { WebsocketManagerService } from 'app/services/ws-manager.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isLoggedIn = false;

  private isLoggedIn$ = new BehaviorSubject<boolean>(false);
  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isLoggedIn$.asObservable();
  }

  constructor(
    private wsManager: WebsocketManagerService,
  ) { }

  login(username: string, password: string): Observable<boolean> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login',
      params: [username, password],
    });
    return this.getFilteredWebsocketResponse<boolean>(uuid).pipe(tap((response) => {
      this.isLoggedIn = response;
      this.isLoggedIn$.next(response);
    }));
  }

  loginWithOtp(username: string, password: string, otp: string): Observable<boolean> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login',
      params: [username, password, otp],
    });
    return this.getFilteredWebsocketResponse<boolean>(uuid).pipe(tap((response) => {
      this.isLoggedIn = response;
      this.isLoggedIn$.next(response);
    }));
  }

  loginWithToken(token: string): Observable<boolean> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login_with_token',
      params: [token],
    });
    return this.getFilteredWebsocketResponse<boolean>(uuid).pipe(tap((response) => {
      this.isLoggedIn = response;
      this.isLoggedIn$.next(response);
    }));
  }

  getFilteredWebsocketResponse<T>(uuid: string): Observable<T> {
    return this.wsManager.websocketSubject$.pipe(
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      map((data: ResultMessage<T>) => data.result),
      take(1),
    );
  }

  generateToken(tokenLiftime: number): Observable<string> {
    const uuid = UUID.UUID();
    const payload: {
      id: string;
      msg: IncomingApiMessageType;
      method: string;
      params?: [number];
    } = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.generate_token',
      params: [tokenLiftime],
    };
    this.wsManager.send(payload);
    return this.getFilteredWebsocketResponse<string>(uuid);
  }

  generateTokenWithDefaultLifetime(): Observable<string> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.generate_token',
    };
    this.wsManager.send(payload);
    return this.getFilteredWebsocketResponse<string>(uuid);
  }

  logout(): Observable<void> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.logout',
    };
    this.wsManager.send(payload);
    return this.getFilteredWebsocketResponse<void>(uuid).pipe(tap(() => {
      this.isLoggedIn = false;
      this.isLoggedIn$.next(false);
    }));
  }
}
