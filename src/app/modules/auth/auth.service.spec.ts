import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { AuthResponse, AuthResponseType } from '@truenas/api-client';
import { createFakeClient, FakeTrueNasClient, withSpies } from '@truenas/api-client/testing';
import {
  LocalStorageService,
  LocalStorageStrategy,
  provideNgxWebstorage,
  STORAGE_STRATEGIES,
  StorageStrategyStub, withLocalStorage,
} from 'ngx-webstorage';
import {
  BehaviorSubject, firstValueFrom,
  of, throwError,
} from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExResponseType } from 'app/interfaces/auth.interface';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { PendingTwoFactorService } from 'app/modules/auth/pending-two-factor.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { TYPED_API_CLIENT, WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let client: FakeTrueNasClient<WebUiApiDirectory>;

  const authMeUser = {
    pw_dir: 'dir',
    pw_gecos: 'gecos',
    pw_gid: 1,
    pw_name: 'name',
    pw_shell: 'shell',
    pw_uid: 2,
    attributes: {
      preferences: {} as Preferences,
      dashState: [] as DashConfigItem[],
      appsAgreement: true,
    },
    privilege: {
      webui_access: true,
    },
    account_attributes: [
      AccountAttribute.Local,
      AccountAttribute.PasswordChangeRequired,
    ],
  } as LoggedInUser;

  // Complete enough for the service to subscribe to all of it. An absent stream
  // here is not a loud failure: `setupWsConnectionUpdate` merges two of them, and
  // `merge(stream, undefined)` reports its TypeError asynchronously, where jsdom
  // logs it and the suite goes on passing with that subscription dead.
  const mockWsStatus = {
    setLoginStatus: jest.fn(),
    setConnectionStatus: jest.fn(),
    setSessionStatus: jest.fn(),
    isConnected$: new BehaviorSubject(true),
    isSessionEstablished$: new BehaviorSubject(true),
    isAuthenticated$: new BehaviorSubject(false),
  } as unknown as WebSocketStatusService;

  const connected$ = (): BehaviorSubject<boolean> => mockWsStatus.isConnected$ as BehaviorSubject<boolean>;
  const sessionUp$ = (): BehaviorSubject<boolean> => mockWsStatus.isSessionEstablished$ as BehaviorSubject<boolean>;

  /**
   * What middleware sends back for a successful login. The authenticator's own
   * `AuthResponse` names a narrower `user_info` than middleware actually sends
   * — see `toLoginExResponse` — so the fixture is the wire object, cast into
   * the shape the fake takes.
   */
  const loginUserInfo = {
    pw_name: 'name',
    privilege: { webui_access: true },
    account_attributes: [
      AccountAttribute.Local,
      AccountAttribute.PasswordChangeRequired,
    ],
  } as unknown as AuthResponse['user_info'];

  const createService = createServiceFactory({
    service: AuthService,
    providers: [
      mockAuth(),
      mockProvider(LocalStorageService),
      // mockAuth's WINDOW stub has non-persisting localStorage jest.fn()s, so drive the
      // pending marker through its service rather than through storage.
      mockProvider(PendingTwoFactorService),
      mockApi([
        mockCall('auth.me', authMeUser),
        mockCall('auth.logout'),
        mockCall('auth.twofactor.config', {
          enabled: true,
          id: 1,
          services: { ssh: true },
          window: 30,
        } as GlobalTwoFactorConfig),
      ]),
      mockTypedApi(),
      {
        provide: TYPED_API_CLIENT,
        useFactory: () => of(client),
      },
      {
        provide: WebSocketStatusService,
        useValue: mockWsStatus,
      },
      {
        provide: STORAGE_STRATEGIES,
        useFactory: () => new StorageStrategyStub(LocalStorageStrategy.strategyName),
        multi: true,
      },
      provideNgxWebstorage(
        withLocalStorage(),
      ),
      mockProvider(Store, {
        dispatch: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    connected$().next(true);
    sessionUp$().next(true);
    client = withSpies(createFakeClient({ version: 'v27.0.0', authenticated: false }), jest.fn);
    // The authenticator waits for an answer to its `auth.logout` frame.
    client.connection.autoReply('auth.logout', ({ id }) => {
      client.connection.receive({ jsonrpc: '2.0', id, result: true });
    });

    spectator = createService();
  });

  afterEach(() => {
    client.close();
  });

  /** Arms the answer the next login gets. Each one is consumed by one login. */
  function armLogin(overrides: Partial<AuthResponse> = {}): void {
    client.authenticator.succeedNextLogin({ user_info: loginUserInfo, ...overrides });
  }

  const loginMechanisms = (): string[] => client.authenticator.logins.map((login) => login.mechanism);
  const loginCredentials = (): string[] => client.authenticator.logins.map((login) => login.credential);

  describe('Login', () => {
    it('signs in on the typed client with a username and password, and stores the reconnect token', async () => {
      armLogin({ reconnect_token: 'DUMMY_TOKEN' });

      const loginResult = await firstValueFrom(spectator.service.login('dummy', 'secret'));
      expect(loginResult).toEqual({
        loginResult: LoginResult.Success,
        loginResponse: expect.objectContaining({
          response_type: LoginExResponseType.Success,
        }),
      });

      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      const token = await firstValueFrom(spectator.service.authToken$);
      expect(token).toBe('DUMMY_TOKEN');

      expect(loginMechanisms()).toEqual(['PASSWORD_PLAIN']);
      expect(loginCredentials()).toEqual(['dummy']);
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.login_ex', expect.anything());
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
    });

    it('signs in on the typed client with a stored token', async () => {
      spectator.service.setQueryToken('DUMMY_TOKEN');
      armLogin({ reconnect_token: 'NEXT_TOKEN' });

      const loginResult = await firstValueFrom(spectator.service.loginWithToken());
      expect(loginResult).toBe(LoginResult.Success);

      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      const token = await firstValueFrom(spectator.service.authToken$);
      expect(token).toBe('NEXT_TOKEN');

      expect(loginMechanisms()).toEqual(['TOKEN_PLAIN']);
      expect(loginCredentials()).toEqual(['DUMMY_TOKEN']);
    });

    it('continues a two-factor login with the OTP code', async () => {
      armLogin();

      const loginResult = await firstValueFrom(spectator.service.login('dummy', 'secret', '123456'));

      expect(loginResult.loginResult).toBe(LoginResult.Success);
      expect(loginMechanisms()).toEqual(['OTP_TOKEN']);
      expect(loginCredentials()).toEqual(['123456']);
    });

    // The authenticator reports a refused credential by throwing rather than by
    // answering, which would otherwise reach the sign-in form as an error modal.
    it('reads a refused password back as a failed login', async () => {
      client.authenticator.failNextLogin(AuthResponseType.AuthErr);

      const result = await firstValueFrom(spectator.service.login('dummy', 'wrong'));

      expect(result.loginResult).toBe(LoginResult.IncorrectDetails);
      expect(result.loginResponse.response_type).toBe(LoginExResponseType.AuthErr);
    });

    it('reads an expired token back as a failed login', async () => {
      spectator.service.setQueryToken('STALE_TOKEN');
      client.authenticator.failNextLogin(AuthResponseType.Expired);

      const result = await firstValueFrom(spectator.service.loginWithToken());

      expect(result).toBe(LoginResult.IncorrectDetails);
      expect(spectator.inject(ErrorHandlerService).showErrorModal).not.toHaveBeenCalled();
    });

    it('emits correct isLocalUser$', async () => {
      armLogin();
      const loginResult = await firstValueFrom(spectator.service.login('dummy', 'secret'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      const isLocalUser = await firstValueFrom(spectator.service.isLocalUser$);
      expect(isLocalUser).toBe(true);

      const isPasswordChangeRequired = await firstValueFrom(spectator.service.isPasswordChangeRequired$);
      expect(isPasswordChangeRequired).toBe(true);
    });
  });

  describe('Logout', () => {
    it('ends the session once, and clears the token', async () => {
      armLogin();
      await firstValueFrom(spectator.service.login('dummy', 'secret'));
      await firstValueFrom(spectator.service.initializeSession());

      await firstValueFrom(spectator.service.logout());

      expect(client.connection.sent).toContainEqual(expect.objectContaining({ method: 'auth.logout' }));
      expect(client.authenticator.authenticated$.value).toBe(false);
      // One socket, one session: there is no second `auth.logout` to send.
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.logout');
      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(false);
      expect(await firstValueFrom(spectator.service.user$)).toBeNull();
    });

    it('clears the stored token before the typed logout, so the sign-in page cannot reuse it', async () => {
      // `authenticator.logout()` drops `authenticated$` at the call, which walks the
      // app to the sign-in page synchronously. If the token were still there, that
      // page would auto-log-in and the sign-out would not stick.
      armLogin({ reconnect_token: 'DUMMY_TOKEN' });
      await firstValueFrom(spectator.service.login('dummy', 'secret'));
      await firstValueFrom(spectator.service.initializeSession());
      expect(spectator.service.hasAuthToken).toBe(true);

      let tokenWhenSessionEnded: boolean | null = null;
      jest.spyOn(client.authenticator, 'logout').mockImplementation(() => {
        tokenWhenSessionEnded = spectator.service.hasAuthToken;
        return of(true);
      });

      await firstValueFrom(spectator.service.logout());

      expect(tokenWhenSessionEnded).toBe(false);
      expect(spectator.service.hasAuthToken).toBe(false);
    });

    it('does not wait for the appliance to acknowledge the typed logout', async () => {
      // The frame is on the wire and the session is already down by the time the
      // authenticator returns, so a socket going down must not hang the sign-out —
      // which would leave the stored token behind for the sign-in page to reuse.
      client.connection.autoReply('auth.logout', () => {});

      await expect(firstValueFrom(spectator.service.logout())).resolves.toBeUndefined();
      expect(client.connection.sent).toContainEqual(expect.objectContaining({ method: 'auth.logout' }));
    });

    it('still signs out when the borrowed legacy session cannot be logged out', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      jest.mocked(spectator.inject(ApiService).call).mockImplementation((method) => {
        return method === 'auth.logout' ? throwError(() => new Error('socket gone')) : of(undefined);
      });

      await expect(firstValueFrom(spectator.service.logout())).resolves.toBeUndefined();
      expect(client.authenticator.authenticated$.value).toBe(false);
    });
  });

  async function setUserRoles(roles: Role[]): Promise<void> {
    const mockedApi = spectator.inject(MockApiService);
    mockedApi.mockCall('auth.me', {
      ...authMeUser,
      privilege: {
        ...authMeUser.privilege,
        roles: {
          $set: roles,
        },
      },
    });

    await firstValueFrom(spectator.service.refreshUser());
  }

  describe('hasRole', () => {
    it('returns false when user does not have required role', async () => {
      await setUserRoles([Role.SharingSmbRead]);
      expect(await firstValueFrom(spectator.service.hasRole([Role.AlertListRead]))).toBe(false);
    });

    it('returns false when supplied array is empty', async () => {
      await setUserRoles([Role.SharingSmbRead]);
      expect(await firstValueFrom(spectator.service.hasRole([]))).toBe(false);
    });

    it('returns true if user has one of the roles', async () => {
      await setUserRoles([Role.SharingSmbRead, Role.SharingSmbWrite]);
      expect(await firstValueFrom(spectator.service.hasRole([Role.SharingSmbRead]))).toBe(true);
    });
  });

  describe('hasWebShellAccess$', () => {
    async function setWebShell(webShell: boolean): Promise<void> {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('auth.me', {
        ...authMeUser,
        privilege: { ...authMeUser.privilege, web_shell: webShell },
      });
      await firstValueFrom(spectator.service.refreshUser());
    }

    it('emits true when the resolved user has the web_shell privilege', async () => {
      await setWebShell(true);
      expect(await firstValueFrom(spectator.service.hasWebShellAccess$)).toBe(true);
    });

    it('emits false when the resolved user lacks the web_shell privilege', async () => {
      await setWebShell(false);
      expect(await firstValueFrom(spectator.service.hasWebShellAccess$)).toBe(false);
    });

    it('does not emit for an unresolved (null) user, then emits once the user resolves', async () => {
      const emissions: boolean[] = [];
      const subscription = spectator.service.hasWebShellAccess$.subscribe((value) => emissions.push(value));

      // User is still null (not yet resolved) - the stream must hold rather than
      // snapshot a premature `false`, which would permanently deny take(1) consumers.
      expect(emissions).toEqual([]);

      await setWebShell(true);
      expect(emissions).toEqual([true]);

      subscription.unsubscribe();
    });
  });

  describe('setQueryToken', () => {
    it('does not set the token if the token is null', async () => {
      spectator.service.setQueryToken(null);
      const result = await firstValueFrom(spectator.service.loginWithToken());
      expect(result).toEqual(LoginResult.NoToken);
      expect(client.authenticator.logins).toEqual([]);
    });

    it('sets the token for both HTTP and HTTPS in non-production environments', async () => {
      const token = 'token';
      const window = spectator.inject<Window>(WINDOW);

      // Test HTTP in development (non-production)
      Object.defineProperty(window, 'location', { value: { protocol: 'http:' } });
      spectator.service.setQueryToken(token);
      armLogin();
      await firstValueFrom(spectator.service.loginWithToken());

      // Test HTTPS
      Object.defineProperty(window, 'location', { value: { protocol: 'https:' } });
      spectator.service.setQueryToken(token);
      armLogin();
      await firstValueFrom(spectator.service.loginWithToken());

      expect(loginMechanisms()).toEqual(['TOKEN_PLAIN', 'TOKEN_PLAIN']);
      expect(loginCredentials()).toEqual([token, token]);
    });
  });

  describe('getGlobalTwoFactorConfig', () => {
    beforeEach(() => {
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    });

    it('fetches global two-factor config from API on first call', async () => {
      const result = await firstValueFrom(spectator.service.getGlobalTwoFactorConfig());

      expect(result).toEqual({
        enabled: true,
        id: 1,
        services: { ssh: true },
        window: 30,
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.twofactor.config');
    });

    it('returns cached config on subsequent calls', async () => {
      await firstValueFrom(spectator.service.getGlobalTwoFactorConfig());
      const api = spectator.inject(ApiService);
      jest.clearAllMocks();

      const result = await firstValueFrom(spectator.service.getGlobalTwoFactorConfig());

      expect(result).toEqual({
        enabled: true,
        id: 1,
        services: { ssh: true },
        window: 30,
      });
      expect(api.call).not.toHaveBeenCalledWith('auth.twofactor.config');
    });
  });

  describe('globalTwoFactorConfigUpdated', () => {
    beforeEach(() => {
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    });

    it('clears cached config when called', async () => {
      await firstValueFrom(spectator.service.getGlobalTwoFactorConfig());
      spectator.service.globalTwoFactorConfigUpdated();

      const result = await firstValueFrom(spectator.service.getGlobalTwoFactorConfig());

      expect(result).toEqual({
        enabled: true,
        id: 1,
        services: { ssh: true },
        window: 30,
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.twofactor.config');
    });
  });

  describe('isTwoFactorSetupRequired', () => {
    beforeEach(() => {
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
    });

    it('returns false when global two-factor is disabled', async () => {
      spectator.inject(MockApiService).mockCall('auth.twofactor.config', {
        enabled: false,
      } as GlobalTwoFactorConfig);

      const result = await firstValueFrom(spectator.service.isTwoFactorSetupRequired());

      expect(result).toBe(false);
    });

    it('returns true when global two-factor is enabled but user has no secret configured', async () => {
      const userWithoutSecret = {
        ...authMeUser,
        two_factor_config: {
          secret_configured: false,
        } as UserTwoFactorConfig,
      };

      spectator.inject(MockApiService).mockCall('auth.me', userWithoutSecret);
      await firstValueFrom(spectator.service.refreshUser());

      const result = await firstValueFrom(spectator.service.isTwoFactorSetupRequired());

      expect(result).toBe(true);
    });

    it('returns false when global two-factor is enabled and user has secret configured', async () => {
      const userWithSecret = {
        ...authMeUser,
        two_factor_config: {
          secret_configured: true,
        } as UserTwoFactorConfig,
      };

      spectator.inject(MockApiService).mockCall('auth.me', userWithSecret);
      await firstValueFrom(spectator.service.refreshUser());

      const result = await firstValueFrom(spectator.service.isTwoFactorSetupRequired());

      expect(result).toBe(false);
    });

    it('returns true when the configured secret has not been confirmed yet', async () => {
      // The reload case this exists for: the user generated a secret and reloaded before
      // confirming it. secret_configured alone would walk them past the setup dialog with
      // an armed secret their authenticator app may never have received.
      const userWithSecret = {
        ...authMeUser,
        two_factor_config: {
          secret_configured: true,
        } as UserTwoFactorConfig,
      };

      spectator.inject(MockApiService).mockCall('auth.me', userWithSecret);
      await firstValueFrom(spectator.service.refreshUser());
      jest.mocked(spectator.inject(PendingTwoFactorService).get).mockReturnValue('renewal');

      const result = await firstValueFrom(spectator.service.isTwoFactorSetupRequired());

      expect(result).toBe(true);
    });
  });

  describe('pending two-factor marker', () => {
    it('clears it when a login is completed with an OTP', async () => {
      // That login validated a code against the account's current secret, which is what
      // the marker is waiting for. Left set, the setup dialog reopens offering only
      // another code or a cancel that deletes a secret the user demonstrably holds.
      armLogin();
      await firstValueFrom(spectator.service.login('name', 'pass', '123456'));

      expect(spectator.inject(PendingTwoFactorService).clear).toHaveBeenCalledWith('name');
    });

    it('leaves it alone for a password-only login', async () => {
      armLogin();
      await firstValueFrom(spectator.service.login('name', 'pass'));

      expect(spectator.inject(PendingTwoFactorService).clear).not.toHaveBeenCalled();
    });
  });

  describe('requiredPasswordChanged', () => {
    it('updates password change status', async () => {
      armLogin();
      await firstValueFrom(spectator.service.login('dummy', 'dummy'));

      await firstValueFrom(spectator.service.initializeSession());

      let isPasswordChangeRequired = await firstValueFrom(spectator.service.isPasswordChangeRequired$);
      expect(isPasswordChangeRequired).toBe(true);

      spectator.service.requiredPasswordChanged();

      isPasswordChangeRequired = await firstValueFrom(spectator.service.isPasswordChangeRequired$);
      expect(isPasswordChangeRequired).toBe(false);
    });
  });

  describe('isFullAdmin', () => {
    it('returns true when user has FullAdmin role', async () => {
      await setUserRoles([Role.FullAdmin]);

      const result = await firstValueFrom(spectator.service.isFullAdmin());

      expect(result).toBe(true);
    });

    it('returns false when user does not have FullAdmin role', async () => {
      await setUserRoles([Role.SharingSmbRead]);

      const result = await firstValueFrom(spectator.service.isFullAdmin());

      expect(result).toBe(false);
    });
  });

  describe('initializeSession', () => {
    it('returns NoToken when called without successful login first', async () => {
      // initializeSession should only be called after a successful login
      // When called without prior login, it should return NoToken
      const result = await firstValueFrom(spectator.service.initializeSession());
      expect(result).toBe(LoginResult.NoToken);
    });

    it('initializes session successfully after login', async () => {
      armLogin({ user_info: authMeUser as unknown as AuthResponse['user_info'], reconnect_token: 'DUMMY_TOKEN' });

      const loginResult = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      const result = await firstValueFrom(spectator.service.initializeSession());
      expect(result).toBe(LoginResult.Success);
      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(true);
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(adminUiInitialized());
    });

    it('initializes session successfully when the login minted no reconnect token', async () => {
      armLogin({ user_info: authMeUser as unknown as AuthResponse['user_info'], reconnect_token: null });

      const loginResult = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      const result = await firstValueFrom(spectator.service.initializeSession());
      expect(result).toBe(LoginResult.Success);
      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(true);
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(adminUiInitialized());
    });

    it('returns NoToken when initializeSession is called twice', async () => {
      armLogin({ user_info: authMeUser as unknown as AuthResponse['user_info'] });

      await firstValueFrom(spectator.service.login('admin', 'password'));
      const firstInit = await firstValueFrom(spectator.service.initializeSession());
      expect(firstInit).toBe(LoginResult.Success);

      // Second call should return NoToken as session is already initialized
      const secondInit = await firstValueFrom(spectator.service.initializeSession());
      expect(secondInit).toBe(LoginResult.NoToken);
    });
  });

  // Note: processLoginResult is now protected and stores data internally
  // We can only test its behavior through public methods
  describe('login and session initialization flow', () => {
    it('successful login does not immediately set login status', async () => {
      armLogin({ user_info: authMeUser as unknown as AuthResponse['user_info'] });

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.Success);
      // Login status should NOT be set yet - it waits for initializeSession
      expect(mockWsStatus.setLoginStatus).not.toHaveBeenCalled();
    });

    it('returns NoAccess when user lacks webui_access', async () => {
      armLogin({
        user_info: {
          ...authMeUser,
          privilege: { webui_access: false },
        } as unknown as AuthResponse['user_info'],
      });

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.NoAccess);

      // Verify session cannot be initialized after NoAccess
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.NoToken);
    });

    it('handles OTP required response', async () => {
      client.authenticator.succeedNextLogin({ response_type: AuthResponseType.OtpRequired });

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.NoOtp);

      // Verify session cannot be initialized when OTP is required
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.NoToken);
    });

    it('handles Denied response', async () => {
      // DENIED is a response_type middleware sends and the client's enum does not list.
      client.authenticator.succeedNextLogin({
        response_type: LoginExResponseType.Denied as unknown as AuthResponseType,
      });

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.Denied);

      // Verify session cannot be initialized when denied
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.NoToken);
    });

    it('handles a Redirect response and keeps the urls it carries', async () => {
      client.authenticator.succeedNextLogin({
        response_type: AuthResponseType.Redirect,
        urls: ['https://truenas.local'],
      });

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));

      expect(result.loginResult).toBe(LoginResult.Redirect);
      expect(result.loginResponse).toMatchObject({ urls: ['https://truenas.local'] });
    });
  });

  describe('losing what the app needs from either socket', () => {
    async function signIn(): Promise<void> {
      armLogin();
      await firstValueFrom(spectator.service.login('dummy', 'secret'));
      await firstValueFrom(spectator.service.initializeSession());
      jest.mocked(mockWsStatus.setLoginStatus).mockClear();
    }

    it('drops the signed-in state when the typed session ends', async () => {
      await signIn();

      sessionUp$().next(false);

      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(false);
      expect(await firstValueFrom(spectator.service.user$)).toBeNull();
    });

    // The legacy socket carries most of the app's calls; losing it is still a
    // reason to go back to sign-in, even while the typed session is fine.
    it('drops the signed-in state when the legacy socket disconnects', async () => {
      await signIn();

      connected$().next(false);

      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(false);
      expect(await firstValueFrom(spectator.service.user$)).toBeNull();
    });

    it('lets the session be initialized again once both are back', async () => {
      await signIn();
      sessionUp$().next(false);

      sessionUp$().next(true);
      armLogin();
      await firstValueFrom(spectator.service.login('dummy', 'secret'));

      expect(await firstValueFrom(spectator.service.initializeSession())).toBe(LoginResult.Success);
    });
  });
});
