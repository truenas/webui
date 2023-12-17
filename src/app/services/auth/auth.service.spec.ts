import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import {
  LocalStorageService,
  LocalStorageStrategy,
  NgxWebstorageModule,
  STORAGE_STRATEGIES,
  StorageStrategyStub,
} from 'ngx-webstorage';
import * as rxjs from 'rxjs';
import { firstValueFrom, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { LoginResult } from 'app/enums/login-result.enum';
import { Role } from 'app/enums/role.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { User } from 'app/interfaces/user.interface';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

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
    imports: [
      NgxWebstorageModule.forRoot(),
    ],
    providers: [
      mockProvider(LocalStorageService),
      mockWebsocket([
        mockCall('auth.me', authMeUser),
        mockCall('user.query', [{} as User]),
      ]),
      mockProvider(WebsocketConnectionService, {
        send: jest.fn(),
        isConnected$: of(true),
        websocket$: of({}),
      }),
      {
        provide: STORAGE_STRATEGIES,
        useFactory: () => new StorageStrategyStub(LocalStorageStrategy.strategyName),
        multi: true,
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();

    const originalMakeRequest = spectator.service.makeRequest.bind(spectator.service);
    jest.spyOn(spectator.service, 'makeRequest').mockImplementation((method: ApiCallMethod, params: never) => {
      originalMakeRequest(method, params).subscribe();

      switch (method) {
        case 'auth.generate_token':
          return of('DUMMY_TOKEN');
        case 'auth.login':
        case 'auth.login_with_token':
          return of(true);
        default:
          return of(null);
      }
    });

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
          'a',
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
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith(expect.objectContaining({
        msg: IncomingApiMessageType.Method,
        method: 'auth.login',
        params: ['dummy', 'dummy'],
      }));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith(expect.objectContaining({
        msg: IncomingApiMessageType.Method,
        method: 'auth.generate_token',
      }));
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
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith(expect.objectContaining({
        msg: IncomingApiMessageType.Method,
        method: 'auth.login_with_token',
        params: ['DUMMY_TOKEN'],
      }));
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('auth.me');
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith(expect.objectContaining({
        msg: IncomingApiMessageType.Method,
        method: 'auth.generate_token',
      }));
    });
  });

  describe('Logout', () => {
    it('calls auth.logout and clears token', () => {
      const obs$ = spectator.service.logout();
      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          {
            a: null,
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
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith(expect.objectContaining({
        msg: IncomingApiMessageType.Method,
        method: 'auth.logout',
      }));
    });
  });

  describe('hasRole', () => {
    async function setUserRoles(roles: Role[]): Promise<void> {
      const mockedWebsocket = spectator.inject(MockWebsocketService);
      mockedWebsocket.mockCall('auth.me', {
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

    it('returns false when there is no user object', async () => {
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
});
