import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import {
  LocalStorageService,
  LocalStorageStrategy,
  provideNgxWebstorage,
  STORAGE_STRATEGIES,
  StorageStrategyStub, withLocalStorage,
} from 'ngx-webstorage';
import * as rxjs from 'rxjs';
import { firstValueFrom, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { LoginExMechanism, LoginExResponse, LoginExResponseType } from 'app/interfaces/auth.interface';
import { DashConfigItem } from 'app/interfaces/dash-config-item.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { ApiService } from 'app/services/websocket/api.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

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
} as LoggedInUser;

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let testScheduler: TestScheduler;
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
          response_type: LoginExResponseType.Success,
          user_info: {
            privilege: { webui_access: true },
          },
        } as LoginExResponse),
      ]),
      mockProvider(WebSocketHandlerService, {
        isConnected$: of(true),
      }),
      {
        provide: STORAGE_STRATEGIES,
        useFactory: () => new StorageStrategyStub(LocalStorageStrategy.strategyName),
        multi: true,
      },
      provideNgxWebstorage(
        withLocalStorage(),
      ),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('Login', () => {
    it('initializes auth session with triggers and token with username/password login', () => {
      jest.spyOn(rxjs, 'timer').mockReturnValueOnce(of(0));

      const obs$ = spectator.service.login('dummy', 'dummy');

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          { a: LoginResult.Success },
        );
        expectObservable(spectator.service.isAuthenticated$).toBe(
          'c',
          { c: true },
        );
        expectObservable(spectator.service.authToken$).toBe(
          'd',
          { d: 'DUMMY_TOKEN' },
        );
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'PASSWORD_PLAIN', username: 'dummy', password: 'dummy' }],
      );
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token');
    });

    it('initializes auth session with triggers and token with token login', () => {
      jest.spyOn(rxjs, 'timer').mockReturnValueOnce(of(0));

      const obs$ = spectator.service.loginWithToken();

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          { a: LoginResult.Success },
        );
        expectObservable(spectator.service.isAuthenticated$).toBe(
          'c',
          { c: true },
        );
        expectObservable(spectator.service.authToken$).toBe(
          'd',
          { d: 'DUMMY_TOKEN' },
        );
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: 'TOKEN_PLAIN', token: 'DUMMY_TOKEN' }],
      );
      expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.generate_token');
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
        expectObservable(spectator.service.isAuthenticated$).toBe(
          'c',
          { c: false },
        );
        expectObservable(spectator.service.authToken$).toBe(
          '|',
          {},
        );
      });
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('auth.logout');
    });
  });

  describe('hasRole', () => {
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

    it('returns true for any role when user has FULL_ADMIN role', async () => {
      await setUserRoles([Role.FullAdmin]);
      expect(await firstValueFrom(spectator.service.hasRole([Role.AlertListRead]))).toBe(true);
    });
  });

  describe('setQueryToken', () => {
    it('does not set the token if the token is null or the protocol is not secure', async () => {
      spectator.service.setQueryToken(null);
      let result = await firstValueFrom(spectator.service.loginWithToken());
      expect(result).toEqual(LoginResult.NoToken);

      const window = spectator.inject<Window>(WINDOW);
      Object.defineProperty(window, 'location', { value: { protocol: 'http:' } });
      spectator.service.setQueryToken('token');
      result = await firstValueFrom(spectator.service.loginWithToken());
      expect(result).toEqual(LoginResult.NoToken);

      const token = 'token';
      window.location.protocol = 'https:';
      spectator.service.setQueryToken(token);
      await firstValueFrom(spectator.service.loginWithToken());
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'auth.login_ex',
        [{ mechanism: LoginExMechanism.TokenPlain, token }],
      );
    });
  });
});
