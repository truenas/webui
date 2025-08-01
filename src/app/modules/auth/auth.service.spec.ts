import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import {
  LocalStorageService,
  LocalStorageStrategy,
  provideNgxWebstorage,
  STORAGE_STRATEGIES,
  StorageStrategyStub, withLocalStorage,
} from 'ngx-webstorage';
import * as rxjs from 'rxjs';
import {
  BehaviorSubject, firstValueFrom,
  of,
} from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { AuthMechanism } from 'app/enums/auth-mechanism.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import {
  AuthenticatorLoginLevel, LoginExMechanism, LoginExResponse, LoginExResponseType,
} from 'app/interfaces/auth.interface';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { adminUiInitialized } from 'app/store/admin-panel/admin.actions';

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let testScheduler: TestScheduler;
  let timer$: BehaviorSubject<0>;

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

  const mockWsStatus = {
    setLoginStatus: jest.fn(),
    setConnectionStatus: jest.fn(),
    isConnected$: new BehaviorSubject(true),
    isAuthenticated$: new BehaviorSubject(false),
  } as unknown as WebSocketStatusService;

  const createService = createServiceFactory({
    service: AuthService,
    providers: [
      mockAuth(),
      mockProvider(LocalStorageService),
      mockApi([
        mockCall('auth.me', authMeUser),
        mockCall('auth.generate_token', 'DUMMY_TOKEN'),
        mockCall('auth.logout'),
        mockCall('auth.login_ex', {
          authenticator: AuthenticatorLoginLevel.Level1,
          response_type: LoginExResponseType.Success,
          user_info: {
            privilege: { webui_access: true },
            account_attributes: [
              AccountAttribute.Local,
              AccountAttribute.PasswordChangeRequired,
            ],
          },
        } as LoginExResponse),
        mockCall('auth.mechanism_choices', [
          AuthMechanism.PasswordPlain,
          AuthMechanism.TokenPlain,
          AuthMechanism.OtpToken,
        ]),
        mockCall('auth.twofactor.config', {
          enabled: true,
          id: 1,
          services: { ssh: true },
          window: 30,
        } as GlobalTwoFactorConfig),
      ]),
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
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
    timer$ = new BehaviorSubject(0);
    jest.spyOn(rxjs, 'timer').mockReturnValue(timer$.asObservable());
  });

  describe('Login', () => {
    it('initializes auth session with triggers and token with username/password login', async () => {
      timer$.next(0);

      // First login
      const loginResult = await firstValueFrom(spectator.service.login('dummy', 'dummy'));
      expect(loginResult).toEqual({
        loginResult: LoginResult.Success,
        loginResponse: expect.objectContaining({
          response_type: LoginExResponseType.Success,
        }),
      });

      // Mock isAuthenticated$ for token generation flow
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
      timer$.next(0);

      // Then initialize session
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      // Check token generation happened
      const token = await firstValueFrom(spectator.service.authToken$);
      expect(token).toBe('DUMMY_TOKEN');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'PASSWORD_PLAIN', username: 'dummy', password: 'dummy' }],
      );
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token');
    });

    it('initializes auth session with triggers and token with token login', async () => {
      timer$.next(0);
      // Set the token before calling loginWithToken
      spectator.service.setQueryToken('DUMMY_TOKEN');

      const loginResult = await firstValueFrom(spectator.service.loginWithToken());
      expect(loginResult).toBe(LoginResult.Success);

      // Mock isAuthenticated$ for token generation flow
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
      timer$.next(0);

      // Token generation now happens in initializeSession
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      // Check token generation happened
      const token = await firstValueFrom(spectator.service.authToken$);
      expect(token).toBe('DUMMY_TOKEN');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'TOKEN_PLAIN', token: 'DUMMY_TOKEN' }],
      );
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token');
    });

    it('initializes auth session with triggers and without token with username/password OTP login', () => {
      timer$.next(0);

      const api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'auth.login_ex') {
          return of({
            authenticator: AuthenticatorLoginLevel.Level1,
            response_type: LoginExResponseType.Success,
            user_info: {
              privilege: { webui_access: true },
              account_attributes: [
                AccountAttribute.Local,
                AccountAttribute.PasswordChangeRequired,
              ],
            },
          } as LoginExResponse);
        }
        if (method === 'auth.mechanism_choices') {
          return of([
            AuthMechanism.PasswordPlain,
            AuthMechanism.OtpToken,
          ]);
        }
        return of();
      });

      const obs$ = spectator.service.login('dummy', 'dummy');

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          {
            a: expect.objectContaining({
              loginResult: LoginResult.Success,
            }),
          },
        );
      });
      expect(api.call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'PASSWORD_PLAIN', username: 'dummy', password: 'dummy' }],
      );
      expect(api.call).not.toHaveBeenCalledWith('auth.me');
      expect(api.call).not.toHaveBeenCalledWith('auth.generate_token');
    });

    it('initializes auth session with LEVEL_2 with no token support.', () => {
      timer$.next(0);

      // Mock the auth.login_ex response for LEVEL_2 authentication
      spectator.inject(MockApiService).mockCall('auth.login_ex', {
        authenticator: AuthenticatorLoginLevel.Level2,
        response_type: LoginExResponseType.Success,
        user_info: {
          privilege: { webui_access: true },
        },
      } as LoginExResponse);

      const obs$ = spectator.service.login('dummy', 'dummy');

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          {
            a: {
              loginResult: LoginResult.Success,
              loginResponse: expect.objectContaining({
                response_type: LoginExResponseType.Success,
              }),
            },
          },
        );
      });

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'PASSWORD_PLAIN', username: 'dummy', password: 'dummy' }],
      );
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.generate_token');
    });

    it('emits correct isLocalUser$', async () => {
      timer$.next(0);

      const loginResult = await firstValueFrom(spectator.service.login('dummy', 'dummy'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      // Mock isAuthenticated$ for token generation flow
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
      timer$.next(0);

      // Initialize session to set the user data
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.Success);

      // Check user properties
      const isLocalUser = await firstValueFrom(spectator.service.isLocalUser$);
      expect(isLocalUser).toBe(true);

      const isPasswordChangeRequired = await firstValueFrom(spectator.service.isPasswordChangeRequired$);
      expect(isPasswordChangeRequired).toBe(true);
    });
  });

  describe('Logout', () => {
    it('calls auth.logout and clears token', () => {
      const obs$ = spectator.service.logout();
      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          {
            a: undefined,
          },
        );
        expectObservable(spectator.service.authToken$).toBe(
          '|',
          {},
        );
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.logout');
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

  describe('setQueryToken', () => {
    it('does not set the token if the token is null', async () => {
      spectator.service.setQueryToken(null);
      const result = await firstValueFrom(spectator.service.loginWithToken());
      expect(result).toEqual(LoginResult.NoToken);
    });

    it('sets the token for both HTTP and HTTPS in non-production environments', async () => {
      const token = 'token';
      const window = spectator.inject<Window>(WINDOW);

      // Test HTTP in development (non-production)
      Object.defineProperty(window, 'location', { value: { protocol: 'http:' } });
      spectator.service.setQueryToken(token);
      await firstValueFrom(spectator.service.loginWithToken());
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: LoginExMechanism.TokenPlain, token }],
      );

      // Test HTTPS
      Object.defineProperty(window, 'location', { value: { protocol: 'https:' } });
      spectator.service.setQueryToken(token);
      await firstValueFrom(spectator.service.loginWithToken());
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: LoginExMechanism.TokenPlain, token }],
      );
    });
  });

  describe('getGlobalTwoFactorConfig', () => {
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
  });

  describe('requiredPasswordChanged', () => {
    it('updates password change status', async () => {
      timer$.next(0);
      await firstValueFrom(spectator.service.login('dummy', 'dummy'));

      // Mock isAuthenticated$ for token generation flow
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);
      timer$.next(0);

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
      // First perform a successful login to set up pending auth data
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        authenticator: AuthenticatorLoginLevel.Level1,
        response_type: LoginExResponseType.Success,
        user_info: authMeUser,
      } as LoginExResponse);

      // Mock isAuthenticated$ to return true for token generation flow
      (mockWsStatus.isAuthenticated$ as BehaviorSubject<boolean>).next(true);

      // Login first
      const loginResult = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      // Trigger timer for token generation
      timer$.next(0);

      // Then initialize session
      const result = await firstValueFrom(spectator.service.initializeSession());
      expect(result).toBe(LoginResult.Success);
      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(true);
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(adminUiInitialized());
    });

    it('initializes session successfully without Level1 authenticator', async () => {
      // First perform a successful login with Level2 authenticator
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        authenticator: AuthenticatorLoginLevel.Level2,
        response_type: LoginExResponseType.Success,
        user_info: authMeUser,
      } as LoginExResponse);

      // Login first
      const loginResult = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(loginResult.loginResult).toBe(LoginResult.Success);

      // Then initialize session
      const result = await firstValueFrom(spectator.service.initializeSession());
      expect(result).toBe(LoginResult.Success);
      expect(mockWsStatus.setLoginStatus).toHaveBeenCalledWith(true);
      expect(spectator.inject(Store).dispatch).toHaveBeenCalledWith(adminUiInitialized());
    });

    it('returns NoToken when initializeSession is called twice', async () => {
      // Setup successful login
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        authenticator: AuthenticatorLoginLevel.Level2,
        response_type: LoginExResponseType.Success,
        user_info: authMeUser,
      } as LoginExResponse);

      // Login and initialize session
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
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        response_type: LoginExResponseType.Success,
        user_info: authMeUser,
        authenticator: AuthenticatorLoginLevel.Level1,
      } as LoginExResponse);

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.Success);
      // Login status should NOT be set yet - it waits for initializeSession
      expect(mockWsStatus.setLoginStatus).not.toHaveBeenCalled();
    });

    it('returns NoAccess when user lacks webui_access', async () => {
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        response_type: LoginExResponseType.Success,
        user_info: {
          ...authMeUser,
          privilege: { webui_access: false },
        },
      } as LoginExResponse);

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.NoAccess);

      // Verify session cannot be initialized after NoAccess
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.NoToken);
    });

    it('handles OTP required response', async () => {
      const apiService = spectator.inject(MockApiService);
      apiService.mockCall('auth.login_ex', {
        response_type: LoginExResponseType.OtpRequired,
      } as LoginExResponse);

      const result = await firstValueFrom(spectator.service.login('admin', 'password'));
      expect(result.loginResult).toBe(LoginResult.NoOtp);

      // Verify session cannot be initialized when OTP is required
      const initResult = await firstValueFrom(spectator.service.initializeSession());
      expect(initResult).toBe(LoginResult.NoToken);
    });
  });

  // Note: Tests for setupAuthenticationUpdate, setupWsConnectionUpdate, and ngOnDestroy
  // have been removed as they test private/protected implementation details.
  // The behavior of these methods is tested indirectly through the public API.
});
