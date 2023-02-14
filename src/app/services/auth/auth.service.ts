import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import {
  BehaviorSubject, combineLatest, filter, map, Observable, of, Subscription, switchMap, take, tap, timer,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { DsUncachedUser, LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { User } from 'app/interfaces/user.interface';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  @LocalStorage() token2: string;
  private loggedInUser$ = new BehaviorSubject<LoggedInUser>(null);

  /**
   * This is 10 seconds less than 300 seconds which is the default life
   * time of a token generated with auth.generate_token. The 10 seconds
   * difference is to allow for delays in request send/receive
   */
  readonly tokenRegenerationTimeMillis = 290 * 1000;

  private isLoggedIn$ = new BehaviorSubject<boolean>(false);

  private generateTokenSubscription: Subscription;

  readonly isAuthenticated$ = combineLatest([this.wsManager.isConnected$, this.isLoggedIn$.asObservable()]).pipe(
    switchMap(([isConnected, isLoggedIn]) => {
      return of(isConnected && isLoggedIn);
    }),
  );

  get user$(): Observable<LoggedInUser> {
    return this.loggedInUser$.asObservable();
  }

  constructor(
    private wsManager: WebsocketConnectionService,
  ) {
    this.isAuthenticated$.pipe(untilDestroyed(this)).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.getLoggedInUserInformation();
          this.setupPeriodicTokenGeneration();
        } else if (this.generateTokenSubscription) {
          this.generateTokenSubscription.unsubscribe();
          this.generateTokenSubscription = null;
        }
      },
    });
  }

  login(username: string, password: string, otp: string = null): Observable<boolean> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login',
      params: otp ? [username, password, otp] : [username, password],
    });
    return this.getFilteredWebsocketResponse<boolean>(uuid).pipe(tap((response) => {
      this.isLoggedIn$.next(response);
    }));
  }

  loginWithToken(): Observable<boolean> {
    const uuid = UUID.UUID();
    this.wsManager.send({
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login_with_token',
      params: [this.token2],
    });
    return this.getFilteredWebsocketResponse<boolean>(uuid).pipe(tap((response) => {
      this.isLoggedIn$.next(response);
    }));
  }

  setupPeriodicTokenGeneration(): void {
    if (!this.generateTokenSubscription || this.generateTokenSubscription.closed) {
      this.generateTokenSubscription = timer(0, this.tokenRegenerationTimeMillis).pipe(
        switchMap(() => this.isAuthenticated$),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.generateToken()),
        tap((token) => this.token2 = token),
        untilDestroyed(this),
      ).subscribe();
    }
  }

  getFilteredWebsocketResponse<T>(uuid: string): Observable<T> {
    return this.wsManager.websocket$.pipe(
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      map((data: ResultMessage<T>) => data.result),
      take(1),
    );
  }

  private generateToken(): Observable<string> {
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
      this.isLoggedIn$.next(false);
    }));
  }

  private getLoggedInUserInformation(): void {
    let authenticatedUser: LoggedInUser;
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.me',
    };
    this.wsManager.send(payload);
    this.getFilteredWebsocketResponse(uuid).pipe(
      switchMap((loggedInUser: DsUncachedUser) => {
        authenticatedUser = loggedInUser;
        const userQueryPayload = {
          id: uuid,
          msg: IncomingApiMessageType.Method,
          method: 'user.query',
          params: [[['uid', '=', authenticatedUser.pw_uid]]],
        };
        this.wsManager.send(userQueryPayload);
        return this.getFilteredWebsocketResponse(uuid);
      }),
      tap((users: User[]) => {
        if (users?.[0]?.id) {
          authenticatedUser = {
            ...authenticatedUser,
            ...users[0],
          };
        }

        this.loggedInUser$.next(authenticatedUser);
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
