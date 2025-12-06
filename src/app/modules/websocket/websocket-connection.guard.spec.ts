import { Location } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketConnectionGuard } from 'app/modules/websocket/websocket-connection.guard';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';

describe('WebSocketConnectionGuard', () => {
  let spectator: SpectatorService<WebSocketConnectionGuard>;
  const isClosed$ = new BehaviorSubject(false);
  const isAccessRestricted$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: WebSocketConnectionGuard,
    providers: [
      mockProvider(WebSocketHandlerService, {
        isClosed$,
        isAccessRestricted$,
        isSystemShuttingDown: false,
      }),
      mockProvider(MatDialog, {
        openDialogs: [],
      }),
      mockProvider(DialogService),
      mockProvider(Location),
      mockProvider(Router),
      {
        provide: WINDOW,
        useValue: {
          sessionStorage,
          location: {
            search: '',
          },
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
    isClosed$.next(false);
    isAccessRestricted$.next(false);
    sessionStorage.clear();

    // Reset window.location.search
    const windowMock = spectator.inject(WINDOW) as { sessionStorage: Storage; location: { search: string } };
    windowMock.location.search = '';
  });

  describe('resetUi on WebSocket disconnect', () => {
    it('stores redirect URL from location.path() when on a regular page', () => {
      const location = spectator.inject(Location);
      jest.spyOn(location, 'path').mockReturnValue('/storage/disks');

      isClosed$.next(true);

      expect(location.path).toHaveBeenCalled();
      expect(sessionStorage.getItem('redirectUrl')).toBe('/storage/disks');
    });

    it('stores redirect URL with query params when available', () => {
      const location = spectator.inject(Location);
      jest.spyOn(location, 'path').mockReturnValue('/credentials/users?tab=local');

      isClosed$.next(true);

      expect(sessionStorage.getItem('redirectUrl')).toBe('/credentials/users?tab=local');
    });

    it('does not store redirect URL when on signin page', () => {
      const location = spectator.inject(Location);
      jest.spyOn(location, 'path').mockReturnValue('/signin');

      isClosed$.next(true);

      expect(sessionStorage.getItem('redirectUrl')).toBeNull();
    });

    it('does not store redirect URL when on signin sub-route', () => {
      const location = spectator.inject(Location);
      jest.spyOn(location, 'path').mockReturnValue('/signin/two-factor');

      isClosed$.next(true);

      expect(sessionStorage.getItem('redirectUrl')).toBeNull();
    });

    it('redirects to signin page on WebSocket disconnect', () => {
      const location = spectator.inject(Location);
      const router = spectator.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      jest.spyOn(location, 'path').mockReturnValue('/dashboard');

      isClosed$.next(true);

      expect(navigateSpy).toHaveBeenCalledWith(['/signin'], { queryParams: {} });
    });

    it('preserves query params when redirecting to signin', () => {
      const location = spectator.inject(Location);
      const router = spectator.inject(Router);
      const navigateSpy = jest.spyOn(router, 'navigate');
      jest.spyOn(location, 'path').mockReturnValue('/dashboard');

      // Mock window.location.search
      const windowMock = spectator.inject(WINDOW) as { sessionStorage: Storage; location: { search: string } };
      windowMock.location.search = '?foo=bar&baz=qux';

      isClosed$.next(true);

      expect(navigateSpy).toHaveBeenCalledWith(['/signin'], {
        queryParams: { foo: 'bar', baz: 'qux' },
      });
    });

    it('closes all open dialogs on WebSocket disconnect', () => {
      const matDialog = spectator.inject(MatDialog);
      const mockDialog1 = { close: jest.fn() };
      const mockDialog2 = { close: jest.fn() };
      Object.defineProperty(matDialog, 'openDialogs', {
        value: [mockDialog1, mockDialog2],
        configurable: true,
      });

      const location = spectator.inject(Location);
      jest.spyOn(location, 'path').mockReturnValue('/dashboard');

      isClosed$.next(true);

      expect(mockDialog1.close).toHaveBeenCalled();
      expect(mockDialog2.close).toHaveBeenCalled();
    });
  });

  describe('canActivate', () => {
    it('always returns true', () => {
      expect(spectator.service.canActivate()).toBe(true);
    });
  });

  describe('location.path() usage for base href compatibility', () => {
    it('uses location.path() which excludes base href in production builds', () => {
      const location = spectator.inject(Location);
      const pathSpy = jest.spyOn(location, 'path').mockReturnValue('/sharing');

      isClosed$.next(true);

      // Verify location.path() was called (works with /ui/ base href)
      expect(pathSpy).toHaveBeenCalled();
      // Verify the URL stored does NOT include base href
      expect(sessionStorage.getItem('redirectUrl')).toBe('/sharing');
    });
  });
});
