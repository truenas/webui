import { Injectable, OnDestroy, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { environment } from 'environments/environment';
import { LocalStorage } from 'ngx-webstorage';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  ReplaySubject,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { AuthMechanism } from 'app/enums/auth-mechanism.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { filterAsync } from 'app/helpers/operators/filter-async.operator';
import { WINDOW } from 'app/helpers/window.helper';
import {
  AuthenticatorLoginLevel, LoginExMechanism, LoginExResponse, LoginExResponseType,
} from 'app/interfaces/auth.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private tokenLastUsedService = inject(TokenLastUsedService);
  private wsStatus = inject(WebSocketStatusService);
  private errorHandler = inject(ErrorHandlerService);
  private window = inject<Window>(WINDOW);

  @LocalStorage() private token: string | undefined | null;
  protected loggedInUser$ = new BehaviorSubject<LoggedInUser | null>(null);

  // Store pending authentication data before session initialization
  private pendingAuthData: {
    userInfo: LoggedInUser;
    authenticator?: AuthenticatorLoginLevel;
  } | null = null;

  // Flag to prevent premature adminUiInitialized dispatch
  private sessionInitialized = false;

  /**
   * This is 10 seconds less than 300 seconds which is the default life
   * time of a token generated with auth.generate_token. The 10 seconds
   * difference is to allow for delays in request send/receive
   */
  private readonly tokenRegenerationTimeMillis = 290 * 1000;

  private latestTokenGenerated$ = new ReplaySubject<string | null>(1);
  get authToken$(): Observable<string> {
    return this.latestTokenGenerated$.asObservable().pipe(filter((token): token is string => !!token));
  }

  get hasAuthToken(): boolean {
    return Boolean(this.token) && this.token !== 'null';
  }

  private generateTokenSubscription: Subscription | null;

  readonly user$ = this.loggedInUser$.asObservable();
  private readonly checkIsTokenAllowed$ = new Subject<void>();

  readonly isLocalUser$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.Local)),
  );

  private readonly hasPasswordChangedSinceLastLogin$ = new BehaviorSubject(false);
  readonly isPasswordChangeRequired$: Observable<boolean> = combineLatest([
    this.user$.pipe(
      filter(Boolean),
      map((user) => user.account_attributes.includes(AccountAttribute.PasswordChangeRequired)),
    ),
    this.hasPasswordChangedSinceLastLogin$,
  ]).pipe(
    map(([changeRequired, changedSinceLastLogin]) => changeRequired && !changedSinceLastLogin),
  );

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

  private readonly cachedGlobalTwoFactorConfig$ = new BehaviorSubject<GlobalTwoFactorConfig | null>(null);

  constructor() {
    this.setupAuthenticationUpdate();
    this.setupWsConnectionUpdate();
    this.setupPeriodicTokenGeneration();
    this.setupTokenUpdate();
  }

  getGlobalTwoFactorConfig(): Observable<GlobalTwoFactorConfig> {
    return this.cachedGlobalTwoFactorConfig$.pipe(
      switchMap((cachedConfig) => {
        if (cachedConfig) {
          return of(cachedConfig);
        }

        return this.api.call('auth.twofactor.config').pipe(
          tap((config) => this.cachedGlobalTwoFactorConfig$.next(config)),
        );
      }),
    );
  }

  globalTwoFactorConfigUpdated(): void {
    this.cachedGlobalTwoFactorConfig$.next(null);
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

  login(
    username: string,
    password: string,
    otp: string | null = null,
  ): Observable<{ loginResult: LoginResult; loginResponse: LoginExResponse }> {
    const loginCall$ = otp
      ? this.api.call('auth.login_ex_continue', [{ mechanism: LoginExMechanism.OtpToken, otp_token: otp }])
      : this.api.call('auth.login_ex', [{ mechanism: LoginExMechanism.PasswordPlain, username, password }]);

    return loginCall$.pipe(
      switchMap((result) => this.processLoginResult(result).pipe(
        map((loginResult) => ({
          loginResponse: result,
          loginResult,
        })),
      )),
    );
  }

  isTwoFactorSetupRequired(): Observable<boolean> {
    return this.getGlobalTwoFactorConfig().pipe(
      switchMap((globalConfig) => {
        if (!globalConfig.enabled) {
          return of(false);
        }

        return this.userTwoFactorConfig$.pipe(
          map((userConfig) => !userConfig.secret_configured),
        );
      }),
    );
  }

  setQueryToken(token: string | null): void {
    const isSecure = this.window.location.protocol === 'https:' || !environment.production;
    if (!token || !isSecure) {
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
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of(LoginResult.NoAccess);
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
    return this.user$.pipe(
      filter(Boolean),
      map((user) => {
        const currentRoles = user?.privilege?.roles?.$set || [];
        const neededRoles = Array.isArray(roles) ? roles : [roles];

        if (!neededRoles?.length || !currentRoles.length) {
          return false;
        }

        return neededRoles.some((role) => currentRoles.includes(role));
      }),
    );
  }

  logout(): Observable<void> {
    return this.api.call('auth.logout').pipe(
      tap(() => {
        this.clearAuthToken();
        this.hasPasswordChangedSinceLastLogin$.next(false);
        this.wsStatus.setLoginStatus(false);
        this.api.clearSubscriptions();
        this.sessionInitialized = false;
        this.pendingAuthData = null;
        this.loggedInUser$.next(null); // Clear user data on logout
        this.cachedGlobalTwoFactorConfig$.next(null); // Clear cached 2FA config
      }),
    );
  }

  requiredPasswordChanged(): void {
    this.hasPasswordChangedSinceLastLogin$.next(true);
  }

  isFullAdmin(): Observable<boolean> {
    return this.hasRole([Role.FullAdmin]).pipe(take(1));
  }

  refreshUser(): Observable<undefined> {
    this.loggedInUser$.next(null);
    return this.getLoggedInUserInformation().pipe(
      map((): undefined => undefined),
    );
  }

  getOneTimeToken(): Observable<string> {
    return this.api.call('auth.generate_token', [300, {}, true, true]);
  }

  /**
   * Completes the login process by initializing the session.
   * This should only be called after all pre-flight checks (like failover) have passed.
   */
  initializeSession(): Observable<LoginResult> {
    if (!this.pendingAuthData) {
      return of(LoginResult.NoToken);
    }

    const { userInfo, authenticator } = this.pendingAuthData;

    // Now safe to set the user and initialize the app
    this.loggedInUser$.next(userInfo);
    this.wsStatus.setLoginStatus(true);
    this.window.sessionStorage.setItem('loginBannerDismissed', 'true');

    // Mark session as initialized and dispatch adminUiInitialized
    this.sessionInitialized = true;
    this.store$.dispatch(adminUiInitialized());

    // Clear pending data
    this.pendingAuthData = null;

    if (authenticator === AuthenticatorLoginLevel.Level1) {
      this.checkIsTokenAllowed$.next();
      return this.latestTokenGenerated$.pipe(
        take(1),
        map(() => LoginResult.Success),
        catchError(() => {
          // Clean up on error
          this.cleanupFailedSession();
          return of(LoginResult.NoToken);
        }),
      );
    }

    return of(LoginResult.Success);
  }

  protected processLoginResult(loginResult: LoginExResponse): Observable<LoginResult> {
    return of(loginResult).pipe(
      switchMap((result) => {
        if (result.response_type === LoginExResponseType.Success) {
          if (!result.user_info?.privilege?.webui_access) {
            // Don't set login status here - wait for session initialization
            return of(LoginResult.NoAccess);
          }

          // Store authentication data but don't initialize session yet
          this.pendingAuthData = {
            userInfo: result.user_info,
            authenticator: result?.authenticator,
          };

          // Return success but session is not initialized
          return of(LoginResult.Success);
        }

        // Don't set login status for error cases - it should remain false
        // Clean up any pending auth data on error
        this.pendingAuthData = null;

        if (result.response_type === LoginExResponseType.OtpRequired) {
          return of(LoginResult.NoOtp);
        }

        if (result.response_type === LoginExResponseType.Redirect) {
          return of(LoginResult.Redirect);
        }

        return of(LoginResult.IncorrectDetails);
      }),
    );
  }

  private setupPeriodicTokenGeneration(): void {
    this.checkIsTokenAllowed$.pipe(
      filterAsync(() => this.wsStatus.isAuthenticated$),
      switchMap(() => this.api.call('auth.mechanism_choices').pipe(
        catchError((wsError: unknown) => {
          console.error(wsError);
          return of([]);
        }),
      )),
      map((choices) => choices.includes(AuthMechanism.TokenPlain)),
    ).subscribe((canGenerateToken) => {
      if (!canGenerateToken) {
        this.latestTokenGenerated$.next(null);
        return;
      }
      if (!this.generateTokenSubscription || this.generateTokenSubscription.closed) {
        this.generateTokenSubscription = timer(0, this.tokenRegenerationTimeMillis).pipe(
          switchMap(() => this.wsStatus.isAuthenticated$.pipe(take(1))),
          filter(Boolean),
          switchMap(() => this.api.call('auth.generate_token')),
          tap((token) => this.latestTokenGenerated$.next(token)),
        ).subscribe();
      }
    });
  }

  private getLoggedInUserInformation(): Observable<LoggedInUser> {
    return this.api.call('auth.me').pipe(
      tap((loggedInUser) => {
        this.loggedInUser$.next(loggedInUser);
      }),
    );
  }

  protected setupAuthenticationUpdate(): void {
    this.wsStatus.isAuthenticated$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated && this.sessionInitialized) {
          this.store$.dispatch(adminUiInitialized());
        } else if (this.generateTokenSubscription) {
          this.latestTokenGenerated$?.complete();
          this.latestTokenGenerated$ = new ReplaySubject<string>(1);
          this.setupTokenUpdate();
          this.generateTokenSubscription.unsubscribe();
          this.generateTokenSubscription = null;
          this.cachedGlobalTwoFactorConfig$.next(null);
        }
      },
    });
  }

  protected setupWsConnectionUpdate(): void {
    this.wsStatus.isConnected$.pipe(
      filter((isConnected) => !isConnected),
      untilDestroyed(this),
    ).subscribe(() => {
      this.wsStatus.setLoginStatus(false);
      this.loggedInUser$.next(null);
      // Reset session initialized flag when connection is lost
      this.sessionInitialized = false;
    });
  }

  protected setupTokenUpdate(): void {
    this.latestTokenGenerated$.pipe(
      untilDestroyed(this),
    ).subscribe((token) => {
      this.token = token;
    });
  }

  ngOnDestroy(): void {
    // @UntilDestroy will handle unsubscribing from all observables
    // Reset session state
    this.sessionInitialized = false;
    this.pendingAuthData = null;
  }

  protected cleanupFailedSession(): void {
    this.sessionInitialized = false;
    this.pendingAuthData = null;
    this.loggedInUser$.next(null);
    this.wsStatus.setLoginStatus(false);
  }
}
