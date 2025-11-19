import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { IncomingMessage } from 'app/interfaces/api-message.interface';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';

describe('TokenLastUsedService', () => {
  let spectator: SpectatorService<TokenLastUsedService>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
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
      mockLocalStorage.getItem.mockReturnValue(null);

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(false);
      });
    });

    it('should return true if tokenLastUsed is within default 5 minutes when no lifetime is set', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 4 * oneMinuteMillis).toISOString();
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'tokenLastUsed') return tokenLastUsed;
        if (key === 'tokenLifetime') return null;
        return null;
      });

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(true);
      });
    });

    it('should return false if tokenLastUsed is older than default 5 minutes when no lifetime is set', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 6 * oneMinuteMillis).toISOString();
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'tokenLastUsed') return tokenLastUsed;
        if (key === 'tokenLifetime') return null;
        return null;
      });

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(false);
      });
    });

    it('should use configured lifetime when set', () => {
      const now = new Date();
      // Token used 8 minutes ago
      const tokenLastUsed = new Date(now.getTime() - 8 * oneMinuteMillis).toISOString();
      // Lifetime set to 10 minutes (600 seconds)
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'tokenLastUsed') return tokenLastUsed;
        if (key === 'tokenLifetime') return '600';
        return null;
      });

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(true);
      });
    });

    it('should return false if tokenLastUsed exceeds configured lifetime', () => {
      const now = new Date();
      // Token used 12 minutes ago
      const tokenLastUsed = new Date(now.getTime() - 12 * oneMinuteMillis).toISOString();
      // Lifetime set to 10 minutes (600 seconds)
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'tokenLastUsed') return tokenLastUsed;
        if (key === 'tokenLifetime') return '600';
        return null;
      });

      spectator.service.isTokenWithinTimeline$.subscribe((value) => {
        expect(value).toBe(false);
      });
    });
  });

  describe('updateTokenLifetime', () => {
    it('should store lifetime in localStorage', () => {
      spectator.service.updateTokenLifetime(600);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('tokenLifetime', '600');
    });
  });

  describe('clearTokenLastUsed', () => {
    it('should clear both tokenLastUsed and tokenLifetime from localStorage', () => {
      spectator.service.clearTokenLastUsed();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tokenLastUsed');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('tokenLifetime');
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
