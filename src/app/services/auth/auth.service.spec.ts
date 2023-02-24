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
import { EMPTY, of } from 'rxjs';
import * as rxjs from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { DsUncachedUser, LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

const uncachedUser: DsUncachedUser = {
  pw_dir: 'dir',
  pw_gecos: 'gecos',
  pw_gid: 1,
  pw_name: 'name',
  pw_shell: 'shell',
  pw_uid: 2,
};

const loggedInUser: LoggedInUser = {
  ...uncachedUser,
  id: 1,
};

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let testScheduler: TestScheduler;
  let strategyStub: StorageStrategy<string>;
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
          websocket$: of(EMPTY),
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
    jest.spyOn(spectator.service, 'authToken$', 'get').mockReturnValue(of('DUMMY_TOKEN'));

    testScheduler = new TestScheduler((actual, expected) => {
      return expect(actual).toEqual(expected);
    });
  });

  describe('Login', () => {
    it('logs user in with credentials', () => {
      jest.spyOn(spectator.service, 'authToken$', 'get').mockImplementation(jest.fn(() => of('DUMMY_TOKEN')));

      jest.spyOn(rxjs, 'timer').mockReturnValue(of(0));

      jest.spyOn(UUID, 'UUID')
        .mockReturnValueOnce('login_uuid')
        .mockReturnValueOnce('logged_in_user_uuid')
        .mockReturnValueOnce('user_query_uuid')
        .mockReturnValue('generate_token_uuid');

      const getFilteredWebsocketResponse = jest.spyOn(spectator.service, 'getFilteredWebsocketResponse');
      when(getFilteredWebsocketResponse).calledWith('login_uuid').mockReturnValue(of(true));
      when(getFilteredWebsocketResponse).calledWith('logged_in_user_uuid').mockReturnValue(of(uncachedUser));
      when(getFilteredWebsocketResponse).calledWith('user_query_uuid').mockReturnValue(of([loggedInUser]));
      when(getFilteredWebsocketResponse).calledWith('generate_token_uuid').mockReturnValue(of('DUMMY_TOKEN'));

      const obs$ = spectator.service.login('dummy', 'dummy');
      expect(spectator.inject(WebsocketConnectionService).send).toHaveBeenCalledWith({
        id: 'login_uuid',
        msg: IncomingApiMessageType.Method,
        method: 'auth.login',
        params: ['dummy', 'dummy'],
      });
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
          '(d|)',
          { d: 'DUMMY_TOKEN' },
        );
        expectObservable(spectator.service.user$).toBe(
          'e',
          { e: { ...loggedInUser } },
        );
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
});
