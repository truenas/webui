import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import { of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { AuthService } from 'app/services/auth/auth.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';

describe('AuthService', () => {
  let spectator: SpectatorService<AuthService>;
  let websocketConnectionService: WebsocketConnectionService;
  let testScheduler: TestScheduler;
  const createService = createServiceFactory({
    service: AuthService,
  });

  beforeEach(() => {
    spectator = createService();

    jest.spyOn(spectator.service, 'authToken$', 'get').mockReturnValue(of('DUMMY_TOKEN'));

    websocketConnectionService = spectator.inject(WebsocketConnectionService);
    jest.spyOn(websocketConnectionService, 'isConnected$', 'get').mockImplementation(jest.fn(() => of(true)));

    jest.spyOn(websocketConnectionService, 'send').mockImplementation(jest.fn());

    testScheduler = new TestScheduler((actual, expected) => {
      return expect(actual).toEqual(expected);
    });
  });

  describe('Login', () => {
    it('logs user in with credentials', () => {
      jest.spyOn(spectator.service, 'getFilteredWebsocketResponse').mockReturnValue(of(true));
      jest.spyOn(websocketConnectionService, 'isConnected$', 'get').mockReturnValue(of(true));

      const obs$ = spectator.service.login('dummy', 'dummy');
      expect(websocketConnectionService.send).toHaveBeenCalledWith({
        id: expect.anything(),
        msg: IncomingApiMessageType.Method,
        method: 'auth.login',
        params: ['dummy', 'dummy'],
      });
      testScheduler.run(({ expectObservable }) => {
        expectObservable(obs$).toBe(
          '(a|)',
          { a: true },
        );
        expectObservable(websocketConnectionService.isConnected$).toBe(
          '(b|)',
          { b: true },
        );
        // expectObservable(spectator.service.isAuthenticated$).toBe(
        //   '---(c|)',
        //   { c: true }
        // );
      });
    });
  });
});
