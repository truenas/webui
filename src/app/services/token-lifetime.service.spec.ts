import { MatDialog } from '@angular/material/dialog';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { Subject } from 'rxjs';
import { mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';
import { TokenLifetimeService } from './token-lifetime.service'; // Adjust the import path

describe('TokenLifetimeService', () => {
  let spectator: SpectatorService<TokenLifetimeService>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  const createService = createServiceFactory({
    service: TokenLifetimeService,
    providers: [
      mockProvider(MatDialog, {
        open: jest.fn(),
        afterOpened: new Subject(),
      }),
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

      expect(spectator.service.isTokenWithinTimeline).toBe(false);
    });

    it('should return true if tokenLastUsed is within 15 minutes', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
      mockLocalStorage.getItem.mockReturnValue(tokenLastUsed);

      expect(spectator.service.isTokenWithinTimeline).toBe(true);
    });

    it('should return false if tokenLastUsed is older than 15 minutes', () => {
      const now = new Date();
      const tokenLastUsed = new Date(now.getTime() - 20 * 60 * 1000).toISOString(); // 20 minutes ago
      mockLocalStorage.getItem.mockReturnValue(tokenLastUsed);

      expect(spectator.service.isTokenWithinTimeline).toBe(false);
    });
  });

  describe('setupTokenLastUsedValue', () => {
    it('should update tokenLastUsed in localStorage on user and WebSocket activity', () => {
      const user$ = spectator.inject(AuthService).user$ as Subject<unknown>;
      const updateTokenLastUsedSpy = jest.spyOn(spectator.service, 'updateTokenLastUsed');
      const ws$ = new Subject();

      jest.spyOn(spectator.inject(WebSocketService), 'getWebSocketStream$').mockReturnValue(ws$);

      spectator.service.setupTokenLastUsedValue();

      user$.next({});
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();

      ws$.next({});
      expect(updateTokenLastUsedSpy).toHaveBeenCalled();
    });
  });
});
