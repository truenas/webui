import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UUID } from 'angular2-uuid';
import { LocalStorage } from 'ngx-webstorage';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  Subscription,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { Role } from 'app/enums/role.enum';
import { IncomingWebsocketMessage, ResultMessage } from 'app/interfaces/api-message.interface';
import { AuthMeUser, LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { User } from 'app/interfaces/user.interface';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  @LocalStorage() private token: string;
  protected loggedInUser$ = new BehaviorSubject<LoggedInUser>(null);

  /**
   * This is 10 seconds less than 300 seconds which is the default life
   * time of a token generated with auth.generate_token. The 10 seconds
   * difference is to allow for delays in request send/receive
   */
  readonly tokenRegenerationTimeMillis = 290 * 1000;

  private latestTokenGenerated$ = new ReplaySubject<string>(1);
  get authToken$(): Observable<string> {
    return this.latestTokenGenerated$.asObservable().pipe(filter((token) => !!token));
  }

  private isLoggedIn$ = new BehaviorSubject<boolean>(false);

  private generateTokenSubscription: Subscription;

  readonly isAuthenticated$ = combineLatest([
    this.wsManager.isConnected$,
    this.isLoggedIn$.asObservable(),
  ]).pipe(
    switchMap(([isConnected, isLoggedIn]) => {
      return of(isConnected && isLoggedIn);
    }),
  );

  readonly user$ = this.loggedInUser$.asObservable();

  readonly userTwoFactorConfig$ = this.loggedInUser$.pipe(
    filter(Boolean),
    map((user) => user.two_factor_config),
  );

  private cachedGlobalTwoFactorConfig: GlobalTwoFactorConfig;

  constructor(
    private wsManager: WebsocketConnectionService,
    private store$: Store<AppState>,
    private ws: WebSocketService,
  ) {
    this.setupAuthenticationUpdate();

    this.setupWsConnectionUpdate();

    this.setupTokenUpdate();
  }

  getGlobalTwoFactorConfig(): Observable<GlobalTwoFactorConfig> {
    if (this.cachedGlobalTwoFactorConfig) {
      return of(this.cachedGlobalTwoFactorConfig);
    }

    return this.ws.call('auth.twofactor.config').pipe(
      tap((config) => {
        this.cachedGlobalTwoFactorConfig = config;
      }),
    );
  }

  globalTwoFactorConfigUpdated(): void {
    this.cachedGlobalTwoFactorConfig = null;
  }

  /**
   * This method exists so removing authToken is deliberate instead of allowing
   * use of the lastGeneratedToken$ and setting token to null/undefined by mistake
   */
  clearAuthToken(): void {
    this.latestTokenGenerated$.next(null);
    this.latestTokenGenerated$.complete();
    this.latestTokenGenerated$ = new ReplaySubject<string>(1);
    this.setupTokenUpdate();
  }

  login(username: string, password: string, otp: string = null): Observable<boolean> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login',
      params: otp ? [username, password, otp] : [username, password],
    };

    const requestTrigger$ = new Observable((subscriber) => {
      this.wsManager.send(payload);
      subscriber.next();
    }).pipe(take(1));

    const uuidFilteredResponse$ = this.getFilteredWebsocketResponse<boolean>(uuid);

    return combineLatest([
      requestTrigger$,
      uuidFilteredResponse$,
    ]).pipe(
      take(1),
      map(([, data]) => data),
      switchMap((loginResponse) => {
        this.isLoggedIn$.next(loginResponse);
        if (!loginResponse) {
          return of(false);
        }

        return this.authToken$.pipe(map(() => loginResponse));
      }),
    );
  }

  loginWithToken(): Observable<boolean> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.login_with_token',
      params: [this.token || ''],
    };

    const requestTrigger$ = new Observable((subscriber) => {
      this.wsManager.send(payload);
      subscriber.next();
    }).pipe(take(1));

    const uuidFilteredResponse$ = this.getFilteredWebsocketResponse<boolean>(uuid);

    return combineLatest([
      requestTrigger$,
      uuidFilteredResponse$,
    ]).pipe(
      map(([, data]) => data),
      tap((response) => {
        this.isLoggedIn$.next(response);
      }),
    );
  }

  /**
   * Checks whether user has any of the supplied roles.
   * Does not ensure that user was loaded.
   *
   * Use mockAuth if you need to set user role in tests.
   */
  hasRole(roles: Role[] | Role): Observable<boolean> {
    return this.loggedInUser$.pipe(
      map((user) => {
        const currentRoles = user?.privilege?.roles?.$set || [];
        const neededRoles = Array.isArray(roles) ? roles : [roles];
        if (!neededRoles?.length || !currentRoles.length) {
          return false;
        }

        if (currentRoles.includes(Role.FullAdmin)) {
          return true;
        }

        return neededRoles.some((role) => currentRoles.includes(role));
      }),
    );
  }

  logout(): Observable<void> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.logout',
    };

    const requestTrigger$ = new Observable((subscriber) => {
      this.wsManager.send(payload);
      this.clearAuthToken();
      subscriber.next();
    }).pipe(take(1));

    const uuidFilteredResponse$ = this.getFilteredWebsocketResponse<void>(uuid);

    return combineLatest([
      requestTrigger$,
      uuidFilteredResponse$,
    ]).pipe(
      map(([, data]) => data),
      tap(() => {
        this.isLoggedIn$.next(false);
      }),
    );
  }

  refreshUser(): void {
    this.loggedInUser$.next(null);
    this.getLoggedInUserInformation();
  }

  // TODO: Make private and rewrite tests not to rely on it.
  getFilteredWebsocketResponse<T>(uuid: string): Observable<T> {
    return this.wsManager.websocket$.pipe(
      filter((data: IncomingWebsocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      map((data: ResultMessage<T>) => data.result),
      take(1),
    );
  }

  private setupPeriodicTokenGeneration(): void {
    if (!this.generateTokenSubscription || this.generateTokenSubscription.closed) {
      this.generateTokenSubscription = timer(0, this.tokenRegenerationTimeMillis).pipe(
        switchMap(() => this.isAuthenticated$.pipe(take(1))),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.generateToken()),
        tap((token) => this.latestTokenGenerated$.next(token)),
        untilDestroyed(this),
      ).subscribe();
    }
  }

  private generateToken(): Observable<string> {
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.generate_token',
    };

    const requestTrigger$ = new Observable((subscriber) => {
      this.wsManager.send(payload);
      subscriber.next();
    }).pipe(take(1));

    const uuidFilteredResponse$ = this.getFilteredWebsocketResponse<string>(uuid);

    return combineLatest([
      requestTrigger$,
      uuidFilteredResponse$,
    ]).pipe(map(([, data]) => data));
  }

  private getLoggedInUserInformation(): void {
    let authenticatedUser: LoggedInUser;
    const uuid = UUID.UUID();
    const payload = {
      id: uuid,
      msg: IncomingApiMessageType.Method,
      method: 'auth.me',
    };

    const requestTrigger$ = new Observable((subscriber) => {
      this.wsManager.send(payload);
      subscriber.next();
    }).pipe(take(1));

    combineLatest([
      requestTrigger$,
      this.getFilteredWebsocketResponse(uuid),
    ]).pipe(
      map(([, data]) => data),
    ).pipe(
      filter((loggedInUser: AuthMeUser) => !!loggedInUser?.pw_uid || loggedInUser?.pw_uid === 0),
      switchMap((loggedInUser: AuthMeUser) => {
        authenticatedUser = { ...loggedInUser };

        const userQueryUuid = UUID.UUID();
        const userQueryPayload = {
          id: userQueryUuid,
          msg: IncomingApiMessageType.Method,
          method: 'user.query',
          params: [[['uid', '=', authenticatedUser.pw_uid]]],
        };

        const requestTriggerUserQuery$ = new Observable((subscriber) => {
          this.wsManager.send(userQueryPayload);
          subscriber.next();
        }).pipe(take(1));

        return combineLatest([
          requestTriggerUserQuery$,
          this.getFilteredWebsocketResponse(userQueryUuid),
        ]).pipe(map(([, data]) => data));
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

  private setupAuthenticationUpdate(): void {
    this.isAuthenticated$.pipe(untilDestroyed(this)).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.store$.dispatch(adminUiInitialized());
          this.refreshUser();
          this.setupPeriodicTokenGeneration();
        } else if (this.generateTokenSubscription) {
          this.latestTokenGenerated$?.complete();
          this.latestTokenGenerated$ = new ReplaySubject<string>(1);
          this.setupTokenUpdate();
          this.generateTokenSubscription.unsubscribe();
          this.generateTokenSubscription = null;
        }
      },
    });
  }

  private setupWsConnectionUpdate(): void {
    this.wsManager.isConnected$.pipe(filter((isConnected) => !isConnected), untilDestroyed(this)).subscribe(() => {
      this.isLoggedIn$.next(false);
    });
  }

  private setupTokenUpdate(): void {
    this.latestTokenGenerated$.pipe(untilDestroyed(this)).subscribe((token) => {
      this.token = token;
    });
  }
}
