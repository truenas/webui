import { fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { SessionExpiringDialog } from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { SessionTimeoutService } from './session-timeout.service';

describe('SessionTimeoutService', () => {
  let spectator: SpectatorService<SessionTimeoutService>;
  const afterClosed$ = new BehaviorSubject<boolean>(true);

  const createService = createServiceFactory({
    service: SessionTimeoutService,
    providers: [
      mockWindow({
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        open: jest.fn(),
      }),
      provideMockStore({
        selectors: [{
          selector: selectPreferences,
          value: { lifetime: 300 },
        }],
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => afterClosed$,
        })),
        afterOpened: of(),
      }),
      mockProvider(TokenLastUsedService),
      mockProvider(WebSocketStatusService, {
        setReconnectAllowed: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
      }),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
        logout: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('starts session timeout and adds event listeners', () => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');

    spectator.service.start();

    expect(window.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), false);
    expect(window.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function), false);
  });

  it('pauses session timeout', fakeAsync(() => {
    spectator.service.start();
    spectator.service.pause();

    tick(300 * 1000);
    expect(spectator.inject(MatDialog).open).not.toHaveBeenCalled();
  }));

  it('resumes session timeout and shows expiration dialog', fakeAsync(() => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');

    spectator.service.start();

    tick(300 * 1000);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SessionExpiringDialog, {
      data: {
        buttonText: 'Extend session',
        message: expect.any(String),
        title: 'Logout',
      },
      disableClose: true,
    });
  }));

  it('stops session timeout and removes event listeners', () => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');

    spectator.service.start();
    spectator.service.stop();

    expect(window.removeEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), false);
    expect(window.removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function), false);
  });

  it('shows session expired message with snackbar', () => {
    const snackbar = spectator.inject(SnackbarService);
    jest.spyOn(snackbar, 'open');

    spectator.service.showSessionExpiredMessage();

    expect(snackbar.open).toHaveBeenCalledWith({
      message: 'Session expired',
      icon: 'mdi-clock-alert-outline',
      iconCssColor: 'var(--orange)',
      duration: 99999,
      button: {
        title: 'Close',
      },
    });
  });
});
