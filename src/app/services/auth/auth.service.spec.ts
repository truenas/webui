import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { UUID } from 'angular2-uuid';
import { when } from 'jest-when';
import {
  LocalStorageService,
  LocalStorageStrategy,
  NgxWebstorageModule,
  StorageStrategy,
  StorageStrategyStub,
  STORAGE_STRATEGIES,
} from 'ngx-webstorage';
import { of } from 'rxjs';
import * as rxjs from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { DsUncachedUser, LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

const uncachedUser: DsUncachedUser = {
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
};

const loggedInUser: LoggedInUser = {
  ...uncachedUser,
  id: 1,
};

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let testScheduler: TestScheduler;
  let strategyStub: StorageStrategy<unknown>;
  const createService = createServiceFactory({
    service: AuthService,
    imports: [
      NgxWebstorageModule.forRoot(),
    ],
    providers: [
      mockProvider(LocalStorageService),
      {
        provide: WebsocketConnectionService,
        useValue: {
          send: jest.fn(),
          isConnected$: of(true),
        },
      },
      {
        provide: STORAGE_STRATEGIES,
        useFactory: () => strategyStub,
        multi: true,
      },
    ],
  });

  beforeEach(() => {
    strategyStub = new StorageStrategyStub(LocalStorageStrategy.strategyName);
    spectator = createService();

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  describe('Login', () => {
    it('initalizes auth session with triggers and token with username/password login', () => {
      jest.spyOn(rxjs, 'timer').mockReturnValueOnce(of(0));

      jest.spyOn(UUID, 'UUID')
        .mockReturnValueOnce('login_uuid')
        .mockReturnValueOnce('logged_in_user_uuid')
        .mockReturnValueOnce('user_query_uuid')
        .mockReturnValueOnce('generate_token_uuid');

      const getFilteredWebsocketResponse = jest.spyOn(spectator.service, 'getFilteredWebsocketResponse');
      when(getFilteredWebsocketResponse).calledWith('login_uuid').mockReturnValue(of(true));
      when(getFilteredWebsocketResponse).calledWith('logged_in_user_uuid').mockReturnValue(of(uncachedUser));
      when(getFilteredWebsocketResponse).calledWith('user_query_uuid').mockReturnValue(of([loggedInUser]));
      when(getFilteredWebsocketResponse).calledWith('generate_token_uuid').mockReturnValue(of('DUMMY_TOKEN'));

      const obs$ = spectator.service.login('dummy', 'dummy');

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          'a',
          { a: true },
        );
        expectObservable(spectator.service.isAuthenticated$).toBe(
          'c',
          { c: true },
        );
        expectObservable(spectator.service.authToken$).toBe(
          'd',
          { d: 'DUMMY_TOKEN' },
        );
        expectObservable(spectator.service.user$).toBe(
          'e',
          { e: { ...loggedInUser } },
        );
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'login_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.login',
        params: ['dummy', 'dummy'],
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'logged_in_user_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.me',
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'user_query_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'user.query',
        params: [[['uid', '=', 2]]],
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'generate_token_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.generate_token',
      });
    });
    it('initalizes auth session with triggers and token with token login', () => {
      jest.spyOn(rxjs, 'timer').mockReturnValueOnce(of(0));

      jest.spyOn(UUID, 'UUID')
        .mockReturnValueOnce('login_with_token_uuid')
        .mockReturnValueOnce('logged_in_user_uuid')
        .mockReturnValueOnce('user_query_uuid')
        .mockReturnValueOnce('generate_token_uuid');

      const getFilteredWebsocketResponse = jest.spyOn(spectator.service, 'getFilteredWebsocketResponse');
      when(getFilteredWebsocketResponse).calledWith('login_with_token_uuid').mockReturnValue(of(true));
      when(getFilteredWebsocketResponse).calledWith('logged_in_user_uuid').mockReturnValue(of(uncachedUser));
      when(getFilteredWebsocketResponse).calledWith('user_query_uuid').mockReturnValue(of([loggedInUser]));
      when(getFilteredWebsocketResponse).calledWith('generate_token_uuid').mockReturnValue(of('DUMMY_TOKEN4'));

      const obs$ = spectator.service.loginWithToken();

      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          { a: true },
        );
        expectObservable(spectator.service.isAuthenticated$).toBe(
          'c',
          { c: true },
        );
        expectObservable(spectator.service.authToken$).toBe(
          'd',
          { d: 'DUMMY_TOKEN4' },
        );
        expectObservable(spectator.service.user$).toBe(
          'e',
          { e: { ...loggedInUser } },
        );
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'login_with_token_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.login_with_token',
        params: ['DUMMY_TOKEN'],
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'logged_in_user_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.me',
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'user_query_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'user.query',
        params: [[['uid', '=', 2]]],
      });
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'generate_token_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.generate_token',
      });
    });
  });

  describe('Logout', () => {
    it('calls auth.logout and clears token', () => {
      jest.spyOn(UUID, 'UUID').mockReturnValueOnce('logout_uuid');
      const getFilteredWebsocketResponse = jest.spyOn(spectator.service, 'getFilteredWebsocketResponse');
      when(getFilteredWebsocketResponse).calledWith('logout_uuid').mockReturnValue(of());
      const obs$ = spectator.service.logout();
      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '|',
          {},
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
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'logout_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.logout',
      });
    });
  });
});
