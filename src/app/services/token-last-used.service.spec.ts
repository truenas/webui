import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Observable, of, Subject } from 'rxjs';
import { oneMinuteMillis } from 'app/constants/time.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
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
    fakeDate(new Date('2026-01-20T00:00:00Z'));
    // The storage mock is shared, and the service reads the stored lifetime as it is built.
    mockLocalStorage.getItem.mockReset();
    spectator = createService();
  });

  afterEach(() => restoreDate());

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

    it('publishes the new lifetime, which is what the token renewal runs on', () => {
      const lifetimes: number[] = [];
      spectator.service.lifetime$.subscribe((lifetime) => lifetimes.push(lifetime));

      spectator.service.updateTokenLifetime(1200);
      spectator.service.clearTokenLastUsed();

      // Seeded from storage (nothing stored, so the 5 minute default), then the configured
      // lifetime, then back to the default once the session is signed out.
      expect(lifetimes).toEqual([300, 1200, 300]);
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
    it('keeps stamping on a socket that never falls quiet', () => {
      const responses$ = new Subject<IncomingMessage>();
      // `mockApi()` hands out a plain object for the handler, so give it the stream directly.
      (spectator.inject(WebSocketHandlerService) as { responses$: Observable<IncomingMessage> })
        .responses$ = responses$;
      const updateTokenLastUsedSpy = jest.spyOn(spectator.service, 'updateTokenLastUsed');

      spectator.service.setupTokenLastUsedValue(of({} as LoggedInUser));
      // The first stamp comes from the user emission; this is about the traffic that follows.
      updateTokenLastUsedSpy.mockClear();
      // `fakeDate` installs a clock that deliberately leaves timers real; swap it for one that
      // fakes them, so the audit interval can be driven here.
      jest.useRealTimers();
      jest.useFakeTimers();

      // A response every second, as the dashboard produces: never a five second gap.
      for (let i = 0; i < 12; i++) {
        responses$.next({ jsonrpc: '2.0', id: String(i), result: '' });
        jest.advanceTimersByTime(1000);
      }

      expect(updateTokenLastUsedSpy).toHaveBeenCalledTimes(2);
    });

    it('should update tokenLastUsed in localStorage on user and WebSocket activity', () => {
      const user$ = spectator.inject(AuthService).user$ as Subject<LoggedInUser>;
      const updateTokenLastUsedSpy = jest.spyOn(spectator.service, 'updateTokenLastUsed');
      const responses$ = new Subject<IncomingMessage>();

      // `responses$` is a field on the borrowed connection's stream, not a
      // getter, so the seam is the provided double rather than the prototype.
      Object.defineProperty(spectator.inject(WebSocketHandlerService), 'responses$', { value: responses$ });

      spectator.service.setupTokenLastUsedValue(of({} as LoggedInUser));

      user$.next({} as LoggedInUser);
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();

      responses$.next({ jsonrpc: '2.0', id: 'id', result: '' });
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();
    });
  });
});
