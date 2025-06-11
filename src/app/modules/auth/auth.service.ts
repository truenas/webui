import { Inject, Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { LocalStorage } from 'ngx-webstorage';
import {
  BehaviorSubject,
  catchError,
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
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  @LocalStorage() private token: string | undefined | null;
  protected loggedInUser$ = new BehaviorSubject<LoggedInUser | null>(null);
  wasOneTimePasswordChanged$ = new BehaviorSubject<boolean>(false);
  wasRequiredPasswordChanged$ = new BehaviorSubject<boolean>(false);

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

  isOtpwUser$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.Otpw)),
  );

  isLocalUser$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.Local)),
  );

  isPasswordChangeRequired$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.PasswordChangeRequired)),
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

  private cachedGlobalTwoFactorConfig: GlobalTwoFactorConfig | null;

  constructor(
    private store$: Store<AppState>,
    private api: ApiService,
    private tokenLastUsedService: TokenLastUsedService,
    private wsStatus: WebSocketStatusService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.setupAuthenticationUpdate();
    this.setupWsConnectionUpdate();
    this.setupPeriodicTokenGeneration();
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
      catchError((error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
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
        this.wasOneTimePasswordChanged$.next(false);
        this.wasRequiredPasswordChanged$.next(false);
        this.wsStatus.setLoginStatus(false);
        this.api.clearSubscriptions();
        this.sessionInitialized = false;
        this.pendingAuthData = null;
      }),
    );
  }

  refreshUser(): Observable<undefined> {
    this.loggedInUser$.next(null);
    return this.getLoggedInUserInformation().pipe(
      map(() => undefined),
    );
  }

  requiredPasswordChanged(): void {
    this.wasRequiredPasswordChanged$.next(true);
  }

  isTwoFactorSetupRequired(): Observable<boolean> {
    return this.getGlobalTwoFactorConfig().pipe(
      switchMap((globalConfig) => {
        if (!globalConfig.enabled) {
          return of(false);
        }
        return this.userTwoFactorConfig$.pipe(
          filter(Boolean),
          map((userConfig) => !userConfig.secret_configured),
        );
      }),
    );
  }

  isFullAdmin(): Observable<boolean> {
    return this.hasRole(Role.FullAdmin);
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
