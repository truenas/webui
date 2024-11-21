import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { IncomingMessage } from 'app/interfaces/api-message.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';

describe('TokenLastUsedService', () => {
  let spectator: SpectatorService<TokenLastUsedService>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  const createService = createServiceFactory({
    service: TokenLastUsedService,
    providers: [
      mockProvider(DialogService),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
        logout: jest.fn().mockReturnValue(new Subject()),
        user$: new Subject(),
      }),
      mockApi(),
      {
        provide: WINDOW,
        useValue: {
          localStorage: mockLocalStorage,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('isTokenWithinTimeline', () => {
    it('should return false if tokenLastUsed is not set', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(null));

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(false);
      });
    });

    it('should return true if tokenLastUsed is within 5 minutes', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 4 * oneMinuteMillis).toISOString();
      mockLocalStorage.getItem.mockReturnValue(tokenLastUsed);

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(true);
      });
    });

    it('should return false if tokenLastUsed is older than 5 minutes', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 20 * oneMinuteMillis).toISOString();
      mockLocalStorage.getItem.mockReturnValue(tokenLastUsed);

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(false);
      });
    });
  });

  describe('setupTokenLastUsedValue', () => {
    it('should update tokenLastUsed in localStorage on user and WebSocket activity', () => {
      const user$ = spectator.inject(AuthService).user$ as Subject<LoggedInUser>;
      const updateTokenLastUsedSpy = jest.spyOn(spectator.service, 'updateTokenLastUsed');
      const responses$ = new Subject<IncomingMessage>();

      jest.spyOn(WebSocketHandlerService.prototype, 'responses$', 'get').mockReturnValue(responses$);

      spectator.service.setupTokenLastUsedValue(of({} as LoggedInUser));

      user$.next({} as LoggedInUser);
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();

      responses$.next({ jsonrpc: '2.0', id: 'id', result: '' });
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();
    });
  });
});
