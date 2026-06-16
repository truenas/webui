import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnToastType } from '@truenas/ui-components';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { Preferences } from 'app/interfaces/preferences.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { SessionTimeoutService } from './session-timeout.service';

describe('SessionTimeoutService', () => {
  let spectator: SpectatorService<SessionTimeoutService>;
  const closed$ = new BehaviorSubject<boolean>(true);
  const mockDialogRef = {
    closed: closed$,
    close: jest.fn(),
  };

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
      mockProvider(TokenLastUsedService),
      mockProvider(WebSocketStatusService, {
        setReconnectAllowed: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        closeAllDialogs: jest.fn(),
        sessionExpiring: jest.fn(() => mockDialogRef),
        afterOpened$: of(),
      }),
      mockProvider(Router),
      mockProvider(AuthService, {
        clearAuthToken: jest.fn(),
        logout: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    mockDialogRef.close.mockClear();
  });

  it('starts session timeout and adds event listeners', () => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');

    spectator.service.start();

    expect(window.addEventListener).toHaveBeenCalledWith('mouseover', expect.any(Function), false);
    expect(window.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function), false);
  });

  it('updates token lifetime when session starts', fakeAsync(() => {
    const tokenLastUsedService = spectator.inject(TokenLastUsedService);

    spectator.service.start();
    tick(0);

    expect(tokenLastUsedService.updateTokenLifetime).toHaveBeenCalledWith(300);
  }));

  it('only updates token lifetime when value changes', fakeAsync(() => {
    const tokenLastUsedService = spectator.inject(TokenLastUsedService);
    const window = spectator.inject<Window>(WINDOW);

    spectator.service.start();
    tick(0);

    const activityHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'mouseover',
    )?.[1];

    expect(tokenLastUsedService.updateTokenLifetime).toHaveBeenCalledTimes(1);

    // Simulate another mouseover event
    if (activityHandler) {
      activityHandler();
      tick(1000);
    }

    // Should still be 1 because lifetime hasn't changed
    expect(tokenLastUsedService.updateTokenLifetime).toHaveBeenCalledTimes(1);
  }));

  it('pauses session timeout', fakeAsync(() => {
    spectator.service.start();
    spectator.service.pause();

    tick(300 * 1000);
    expect(spectator.inject(DialogService).sessionExpiring).not.toHaveBeenCalled();
  }));

  it('resumes session timeout and shows expiration dialog', fakeAsync(() => {
    const window = spectator.inject<Window>(WINDOW);
    jest.spyOn(window, 'open');

    spectator.service.start();

    tick(300 * 1000);
    expect(spectator.inject(DialogService).sessionExpiring).toHaveBeenCalledWith({
      buttonText: 'Extend session',
      message: expect.any(String),
      title: 'Logout',
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
      type: TnToastType.Warning,
      button: {
        title: 'Close',
      },
    });
  });

  it('resets inactivity timer when user activity is detected', fakeAsync(() => {
    const window = spectator.inject<Window>(WINDOW);
    const dialogService = spectator.inject(DialogService);

    spectator.service.start();
    tick(0);

    const addEventListenerMock = window.addEventListener as jest.Mock;
    const mouseoverCall = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'mouseover',
    );
    const activityHandler = mouseoverCall[1] as () => void;

    // Wait 200 seconds (out of 300), then simulate activity
    tick(200 * 1000);
    activityHandler();
    // Wait for debounce
    tick(1000);

    // Wait another 200 seconds — should NOT have timed out (timer was reset)
    tick(200 * 1000);
    expect(dialogService.sessionExpiring).not.toHaveBeenCalled();

    // Wait the remaining 100 seconds — now it should show the warning
    tick(100 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalled();
  }));

  it('does not reset timer on mouse activity while warning dialog is open', fakeAsync(() => {
    const window = spectator.inject<Window>(WINDOW);
    const dialogService = spectator.inject(DialogService);

    const dialogClosed$ = new Subject<boolean>();
    const dialogCloseSpy = jest.fn();
    jest.spyOn(dialogService, 'sessionExpiring').mockReturnValue({
      closed: dialogClosed$,
      close: dialogCloseSpy,
    } as unknown as ReturnType<typeof dialogService.sessionExpiring>);

    spectator.service.start();
    tick(0);

    const addEventListenerMock = window.addEventListener as jest.Mock;
    const mouseoverCall = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'mouseover',
    );
    const activityHandler = mouseoverCall[1] as () => void;

    // Wait for the timeout to fire and show the warning dialog
    tick(300 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalled();

    // Simulate mouse activity while dialog is open
    activityHandler();
    tick(0);

    // Dialog should NOT be closed — user must click "Extend session"
    expect(dialogCloseSpy).not.toHaveBeenCalled();

    // Clean up to prevent expireSession from firing
    spectator.service.stop();
  }));

  it('expires session after warning dialog timeout elapses', fakeAsync(() => {
    const dialogService = spectator.inject(DialogService);
    const authService = spectator.inject(AuthService);
    jest.spyOn(authService, 'logout').mockReturnValue(of(undefined));

    const dialogClosed$ = new Subject<boolean>();
    jest.spyOn(dialogService, 'sessionExpiring').mockReturnValue({
      closed: dialogClosed$,
      close: jest.fn(),
    } as unknown as ReturnType<typeof dialogService.sessionExpiring>);

    spectator.service.start();
    tick(0);

    // Wait for warning dialog to appear
    tick(300 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalled();

    // Wait for the 30-second warning period to elapse without user action
    tick(30 * 1000);

    expect(authService.clearAuthToken).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/signin']);
    expect(dialogService.closeAllDialogs).toHaveBeenCalled();
  }));

  it('extends session when user clicks Extend in warning dialog', fakeAsync(() => {
    const dialogService = spectator.inject(DialogService);

    const dialogClosed$ = new Subject<boolean>();
    jest.spyOn(dialogService, 'sessionExpiring').mockReturnValue({
      closed: dialogClosed$,
      close: jest.fn(),
    } as unknown as ReturnType<typeof dialogService.sessionExpiring>);

    spectator.service.start();
    tick(0);

    // Wait for warning dialog to appear
    tick(300 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalledTimes(1);

    // User clicks "Extend session"
    dialogClosed$.next(true);
    tick(0);

    // Timer should restart — wait full lifetime again and expect a second warning
    tick(300 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalledTimes(2);

    spectator.service.stop();
  }));

  it('closes warning dialog and resets timer when preferences change during warning', fakeAsync(() => {
    const dialogService = spectator.inject(DialogService);
    const store$ = spectator.inject(MockStore);

    const dialogClosed$ = new Subject<boolean>();
    const dialogCloseSpy = jest.fn();
    jest.spyOn(dialogService, 'sessionExpiring').mockReturnValue({
      closed: dialogClosed$,
      close: dialogCloseSpy,
    } as unknown as ReturnType<typeof dialogService.sessionExpiring>);

    spectator.service.start();
    tick(0);

    // Wait for warning dialog to appear
    tick(300 * 1000);
    expect(dialogService.sessionExpiring).toHaveBeenCalled();

    // Change preferences while warning dialog is open
    store$.overrideSelector(selectPreferences, { lifetime: 600 } as Preferences);
    store$.refreshState();
    tick(0);

    // Warning dialog should be closed by the preference-triggered reset
    expect(dialogCloseSpy).toHaveBeenCalled();

    // Clean up
    spectator.service.stop();
  }));
});
