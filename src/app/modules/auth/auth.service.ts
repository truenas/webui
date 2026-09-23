import { DestroyRef, Injectable, OnDestroy, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { environment } from 'environments/environment';
import { LocalStorage } from 'ngx-webstorage';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  defaultIfEmpty,
  filter,
  map,
  merge,
  Observable,
  of,
  ReplaySubject,
  switchMap,
  take,
  tap,
  timeout,
} from 'rxjs';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { GlobalTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { PendingTwoFactorService } from 'app/modules/auth/pending-two-factor.service';
import { asLoginExResponse } from 'app/modules/auth/typed-login-response';
import { ApiService } from 'app/modules/websocket/api.service';
import { TYPED_API_CLIENT } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

/** How long the typed logout waits for middleware's acknowledgement before giving up on it. */
const logoutAckTimeoutMs = 10_000;

@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private client$ = inject(TYPED_API_CLIENT);
  private typedApi = inject(TypedApiService);
  private tokenLastUsedService = inject(TokenLastUsedService);
  private wsStatus = inject(WebSocketStatusService);
  private errorHandler = inject(ErrorHandlerService);
  private pendingTwoFactor = inject(PendingTwoFactorService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  @LocalStorage() private token: string | undefined | null;
  protected loggedInUser$ = new BehaviorSubject<LoggedInUser | null>(null);

  // Store pending authentication data before session initialization
  private pendingAuthData: {
    userInfo: LoggedInUser;
  } | null = null;

  // Flag to prevent premature adminUiInitialized dispatch
  private sessionInitialized = false;

  private latestTokenGenerated$ = new ReplaySubject<string | null>(1);
  get authToken$(): Observable<string> {
    return this.latestTokenGenerated$.asObservable().pipe(filter((token): token is string => !!token));
  }

  get hasAuthToken(): boolean {
    return Boolean(this.token) && this.token !== 'null';
  }

  readonly user$ = this.loggedInUser$.asObservable();

  readonly isLocalUser$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => user.account_attributes.includes(AccountAttribute.Local)),
  );

  /**
   * Whether the current user is allowed to open a Web Shell. Every shell
   * (system, VM serial, container console) connects through the same
   * `/websocket/shell/` endpoint, which is gated by the `web_shell` privilege.
   *
   * Only emits for a resolved (non-null) user. `take(1)`-gated consumers (e.g.
   * the terminal access check) rely on this: shell routes sit behind AuthGuard,
   * so a user is always resolved by the time they activate. Filtering out the
   * transient nulls (initial seed, refreshUser, reconnect) means we wait for the
   * re-resolved user instead of snapshotting a premature `false` and denying
   * access permanently.
   */
  readonly hasWebShellAccess$: Observable<boolean> = this.user$.pipe(
    filter(Boolean),
    map((user) => Boolean(user.privilege?.web_shell)),
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
    this.setupTokenUpdate();
  }

  getGlobalTwoFactorConfig(): Observable<GlobalTwoFactorConfig> {
    return this.cachedGlobalTwoFactorConfig$.pipe(
      switchMap((cachedConfig) => {
        if (cachedConfig) {
          return of(cachedConfig);
        }

        return this.wsStatus.isAuthenticated$.pipe(
          take(1),
          filter(Boolean),
          switchMap(() => this.api.call('auth.twofactor.config').pipe(
            tap((config) => this.cachedGlobalTwoFactorConfig$.next(config)),
          )),
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

  /**
   * Signs in on the typed client, which is where the app's session lives.
   *
   * The authenticator speaks `auth.login_ex` and owns the reconnect-token
   * chain, so a password login mints the token the next reconnect spends. It
   * reports a refused credential by throwing rather than by answering, which
   * `asLoginExResponse` puts back as the `AUTH_ERR` the UI already handles.
   */
  login(
    username: string,
    password: string,
    otp: string | null = null,
  ): Observable<{ loginResult: LoginResult; loginResponse: LoginExResponse }> {
    const loginCall$ = this.client$.pipe(
      switchMap((client) => (otp
        ? client.authenticator.loginWithOtp(otp)
        : client.authenticator.loginWithUserPass(username, password))),
      asLoginExResponse(),
    );

    return loginCall$.pipe(
      tap((result) => {
        // A successful OTP login validated a code against the account's current secret,
        // which is exactly what the pending marker is waiting for. Without clearing it
        // here the setup dialog reopens on the next guard run, offering only another code
        // or a Cancel Setup that deletes a secret the user demonstrably holds.
        if (otp && result.response_type === LoginExResponseType.Success && result.user_info?.pw_name) {
          this.pendingTwoFactor.clear(result.user_info.pw_name);
        }
      }),
      switchMap((result) => this.processLoginResult(result).pipe(
        map((loginResult) => ({
          loginResponse: result,
          loginResult,
        })),
      )),
    );
  }

  isTwoFactorSetupRequired(): Observable<boolean> {
    return this.wsStatus.isAuthenticated$.pipe(
      take(1),
      filter(Boolean),
      switchMap(() => this.getGlobalTwoFactorConfig().pipe(
        switchMap((globalConfig) => {
          if (!globalConfig.enabled) {
            return of(false);
          }

          // A secret that exists but has not been confirmed still needs the prompt: the
          // user may have reloaded mid-setup, and `secret_configured` alone would let
          // them past the dialog with an armed secret their app never received.
          return this.user$.pipe(
            filter(Boolean),
            map((user) => {
              return !user.two_factor_config.secret_configured
                || !!this.pendingTwoFactor.get(user.pw_name);
            }),
          );
        }),
      )),
      defaultIfEmpty(false),
    );
  }

  setQueryToken(token: string | null): void {
    const isSecure = this.window.location.protocol === 'https:' || !environment.production;
    if (!token || !isSecure) {
      return;
    }

    this.token = token;
  }

  /**
   * Spends the stored reconnect token on the typed client.
   *
   * Tokens are single-use, so every login mints the next one; `processLoginResult`
   * stores it. A token session is the one the client will not restore by itself
   * after a reconnect — by design, since the token it held has been spent — which
   * is why the sign-in page comes back through here on every reconnect.
   */
  loginWithToken(): Observable<LoginResult> {
    const token = this.token;
    if (!token) {
      return of(LoginResult.NoToken);
    }

    performance.mark('Login Start');
    return this.client$.pipe(
      switchMap((client) => client.authenticator.loginWithToken(token)),
      asLoginExResponse(),
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

  /**
   * Ends both sessions: the typed one the user is signed in on, and the one
   * the legacy socket borrowed from it. The borrowed session would otherwise
   * outlive the sign-out and keep answering calls on that socket.
   *
   * The stored token goes first, before either call. `authenticator.logout()`
   * drops `authenticated$` at the call rather than when middleware answers, and
   * that walks the app to the sign-in page synchronously — which auto-logs-in
   * from the stored token. Clearing first leaves it nothing to log in with.
   *
   * The legacy logout is best effort. It is a session nothing will use again,
   * and a socket that is already down must not turn signing out into an error.
   */
  logout(): Observable<void> {
    return this.client$.pipe(
      take(1),
      switchMap((client) => {
        this.endLocalSession();

        // Calling this is what ends the typed session: the authenticator clears
        // its credentials, drops `authenticated$` and writes the frame before it
        // returns. What it returns only carries middleware's acknowledgement,
        // which a socket on its way down may never send — so it is subscribed for
        // its errors rather than waited on, and the sign-out cannot hang on it.
        client.authenticator.logout().pipe(
          // The acknowledgement may never come — the socket going down is the
          // case this is written for — so the wait is bounded rather than left
          // open for the life of the service.
          timeout(logoutAckTimeoutMs),
          takeUntilDestroyed(this.destroyRef),
        ).subscribe({
          error: (error: unknown) => console.warn('Typed session logout was not acknowledged', error),
        });

        return this.api.call('auth.logout').pipe(
          catchError((error: unknown) => {
            console.warn('Borrowed legacy session could not be logged out', error);
            return of(undefined);
          }),
        );
      }),
      map((): undefined => undefined),
    );
  }

  /** Drops everything this tab knows about the session it was signed in on. */
  private endLocalSession(): void {
    this.clearAuthToken();
    this.hasPasswordChangedSinceLastLogin$.next(false);
    this.wsStatus.setLoginStatus(false);
    this.api.clearSubscriptions();
    this.sessionInitialized = false;
    this.pendingAuthData = null;
    this.loggedInUser$.next(null); // Clear user data on logout
    this.cachedGlobalTwoFactorConfig$.next(null); // Clear cached 2FA config
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

    const { userInfo } = this.pendingAuthData;

    // Now safe to set the user and initialize the app
    this.loggedInUser$.next(userInfo);
    this.wsStatus.setLoginStatus(true);
    this.window.sessionStorage.setItem('loginBannerDismissed', 'true');

    // Mark session as initialized and dispatch adminUiInitialized
    this.sessionInitialized = true;
    this.store$.dispatch(adminUiInitialized());

    // Clear pending data
    this.pendingAuthData = null;

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
          };

          // Store reconnect token from the login response
          if (result.reconnect_token) {
            this.latestTokenGenerated$.next(result.reconnect_token);
          }

          // The session is on the typed socket; everything that happens next —
          // the failover checks, `auth.me`, the boot calls — is still on the
          // legacy one, which has no session of its own. Lend it this one
          // before reporting success, or all of it is refused.
          return this.typedApi.lendSessionToLegacySocket().pipe(
            map(() => LoginResult.Success),
          );
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

        if (result.response_type === LoginExResponseType.Denied) {
          return of(LoginResult.Denied);
        }

        return of(LoginResult.IncorrectDetails);
      }),
    );
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (isAuthenticated) => {
        if (isAuthenticated && this.sessionInitialized) {
          this.store$.dispatch(adminUiInitialized());
        } else if (!isAuthenticated) {
          this.cachedGlobalTwoFactorConfig$.next(null);
        }
      },
    });
  }

  /**
   * Drops the signed-in state when either socket loses what the app needs from
   * it: the typed session it is signed in on, or the legacy socket that still
   * carries most of its calls.
   *
   * Both end the same way — back to the sign-in page, which logs straight in
   * again when the stored token is still good.
   */
  protected setupWsConnectionUpdate(): void {
    merge(
      this.wsStatus.isConnected$,
      this.wsStatus.isSessionEstablished$,
    ).pipe(
      filter((isUp) => !isUp),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.wsStatus.setLoginStatus(false);
      this.loggedInUser$.next(null);
      // Reset session initialized flag when connection is lost
      this.sessionInitialized = false;
    });
  }

  protected setupTokenUpdate(): void {
    this.latestTokenGenerated$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((token) => {
      this.token = token;
    });
  }

  ngOnDestroy(): void {
    // Reset session state
    this.sessionInitialized = false;
    this.pendingAuthData = null;
  }
}
