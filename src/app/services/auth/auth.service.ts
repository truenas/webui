import { Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
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
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExMechanism, LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { ApiService } from 'app/services/websocket/api.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

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
  private readonly tokenRegenerationTimeMillis = 290 * 1000;

  private latestTokenGenerated$ = new ReplaySubject<string>(1);
  get authToken$(): Observable<string> {
    return this.latestTokenGenerated$.asObservable().pipe(filter((token) => !!token));
  }

  get hasAuthToken(): boolean {
    return this.token && this.token !== 'null';
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

  /**
   * Special case that only matches root and admin users.
   */
  readonly isSysAdmin$ = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.SysAdmin)),
  );

  readonly userTwoFactorConfig$ = this.user$.pipe(
    filter(Boolean),
    map((user) => user.two_factor_config),
  );

  private cachedGlobalTwoFactorConfig: GlobalTwoFactorConfig;

  constructor(
    private wsManager: WebSocketHandlerService,
    private store$: Store<AppState>,
    private api: ApiService,
    private tokenLastUsedService: TokenLastUsedService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.setupAuthenticationUpdate();
    this.setupWsConnectionUpdate();
    this.setupTokenUpdate();
  }

  getGlobalTwoFactorConfig(): Observable<GlobalTwoFactorConfig> {
    if (this.cachedGlobalTwoFactorConfig) {
      return of(this.cachedGlobalTwoFactorConfig);
    }

    return this.api.call('auth.twofactor.config').pipe(
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
    this.window.sessionStorage.removeItem('loginBannerDismissed');
    this.tokenLastUsedService.clearTokenLastUsed();
    this.latestTokenGenerated$.next(null);
    this.latestTokenGenerated$.complete();
    this.latestTokenGenerated$ = new ReplaySubject<string>(1);
    this.setupTokenUpdate();
  }

  login(username: string, password: string, otp: string = null): Observable<LoginResult> {
    return (otp
      ? this.api.call('auth.login_ex_continue', [{ mechanism: LoginExMechanism.OtpToken, otp_token: otp }])
      : this.api.call('auth.login_ex', [{ mechanism: LoginExMechanism.PasswordPlain, username, password }])
    ).pipe(
      switchMap((loginResult) => this.processLoginResult(loginResult)),
    );
  }

  setQueryToken(token: string | null): void {
    if (!token || this.window.location.protocol !== 'https:') {
      return;
    }

    this.token = token;
  }

  loginWithToken(): Observable<LoginResult> {
    if (!this.token) {
      return of(LoginResult.NoToken);
    }

    performance.mark('Login Start');
    return this.api.call('auth.login_ex', [{
      mechanism: LoginExMechanism.TokenPlain,
      token: this.token,
    }]).pipe(
      switchMap((loginResult) => this.processLoginResult(loginResult)),
    );
  }

  /**
   * Checks whether user has any of the supplied roles.
   * Does not ensure that user was loaded.
   *
   * Use mockAuth if you need to set user role in tests.
   */
  hasRole(roles: Role[] | Role): Observable<boolean> {
    return this.user$.pipe(
      filter(Boolean),
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
    return this.api.call('auth.logout').pipe(
      tap(() => {
        this.clearAuthToken();
        this.api.clearSubscriptions();
        this.isLoggedIn$.next(false);
      }),
    );
  }

  refreshUser(): Observable<void> {
    this.loggedInUser$.next(null);
    return this.getLoggedInUserInformation().pipe(
      map(() => null),
    );
  }

  private processLoginResult(loginResult: LoginExResponse): Observable<LoginResult> {
    return of(loginResult).pipe(
      switchMap((result) => {
        if (result.response_type === LoginExResponseType.Success) {
          this.loggedInUser$.next(result.user_info);

          if (!result.user_info?.privilege?.webui_access) {
            this.isLoggedIn$.next(false);
            return of(LoginResult.NoAccess);
          }

          this.isLoggedIn$.next(true);
          this.window.sessionStorage.setItem('loginBannerDismissed', 'true');
          return this.authToken$.pipe(
            take(1),
            map(() => LoginResult.Success),
          );
        }
        this.isLoggedIn$.next(false);

        if (result.response_type === LoginExResponseType.OtpRequired) {
          return of(LoginResult.NoOtp);
        }
        return of(LoginResult.IncorrectDetails);
      }),
    );
  }

  private setupPeriodicTokenGeneration(): void {
    if (!this.generateTokenSubscription || this.generateTokenSubscription.closed) {
      this.generateTokenSubscription = timer(0, this.tokenRegenerationTimeMillis).pipe(
        switchMap(() => this.isAuthenticated$.pipe(take(1))),
        filter((isAuthenticated) => isAuthenticated),
        switchMap(() => this.api.call('auth.generate_token')),
        tap((token) => this.latestTokenGenerated$.next(token)),
      ).subscribe();
    }
  }

  private getLoggedInUserInformation(): Observable<LoggedInUser> {
    return this.api.call('auth.me').pipe(
      tap((loggedInUser) => {
        this.loggedInUser$.next(loggedInUser);
      }),
    );
  }

  private setupAuthenticationUpdate(): void {
    this.isAuthenticated$.subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated) {
          this.store$.dispatch(adminUiInitialized());
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
    this.wsManager.isConnected$.pipe(filter((isConnected) => !isConnected)).subscribe(() => {
      this.isLoggedIn$.next(false);
    });
  }

  private setupTokenUpdate(): void {
    this.latestTokenGenerated$.subscribe((token) => {
      this.token = token;
    });
  }
}
