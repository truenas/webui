import { fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { SessionExpiringDialog } from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { SessionTimeoutService } from './session-timeout.service';

describe('SessionTimeoutService', () => {
  let spectator: SpectatorService<SessionTimeoutService>;
  const afterClosed$ = new BehaviorSubject<boolean>(true);
  const mockDialogRef = {
    afterClosed: () => afterClosed$,
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
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
        afterOpened: of(),
      }),
      mockProvider(TokenLastUsedService),
      mockProvider(WebSocketStatusService, {
        setReconnectAllowed: jest.fn(),
      }),
      mockProvider(MatSnackBar),
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
    const resumeHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      (call) => call[0] === 'mouseover',
    )?.[1];

    spectator.service.start();
    tick(0);

    expect(tokenLastUsedService.updateTokenLifetime).toHaveBeenCalledTimes(1);

    // Simulate another mouseover event (resume called again)
    if (resumeHandler) {
      resumeHandler();
      tick(0);
    }

    // Should still be 1 because lifetime hasn't changed
    expect(tokenLastUsedService.updateTokenLifetime).toHaveBeenCalledTimes(1);
  }));

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

  it('closes warning dialog and resets timer when user is active during warning period', fakeAsync(() => {
    const window = spectator.inject<Window>(WINDOW);
    const matDialog = spectator.inject(MatDialog);

    // Use a Subject that doesn't emit until we tell it to
    const dialogAfterClosed$ = new Subject<boolean>();
    const dialogCloseSpy = jest.fn();
    jest.spyOn(matDialog, 'open').mockReturnValue({
      afterClosed: () => dialogAfterClosed$,
      close: dialogCloseSpy,
    } as unknown as ReturnType<typeof matDialog.open>);

    spectator.service.start();
    tick(0);

    // Get the resume handler that was registered
    const addEventListenerMock = window.addEventListener as jest.Mock;
    const mouseoverCall = addEventListenerMock.mock.calls.find(
      (call) => call[0] === 'mouseover',
    );
    expect(mouseoverCall).toBeDefined();
    const resumeHandler = mouseoverCall[1] as () => void;

    // Wait for the timeout to fire and show the warning dialog
    tick(300 * 1000);
    expect(matDialog.open).toHaveBeenCalled();

    // Simulate user activity while dialog is open
    resumeHandler();
    tick(0);

    // Dialog should be closed with true (extend session)
    expect(dialogCloseSpy).toHaveBeenCalledWith(true);
  }));
});
