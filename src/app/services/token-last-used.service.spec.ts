import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketService } from 'app/services/ws.service';

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
      mockWebSocket(),
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
      const ws$ = new Subject();

      jest.spyOn(spectator.inject(WebSocketService), 'getWebSocketStream$').mockReturnValue(ws$);

      spectator.service.setupTokenLastUsedValue(of({} as LoggedInUser));

      user$.next({} as LoggedInUser);
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();

      ws$.next({});
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();
    });
  });
});
