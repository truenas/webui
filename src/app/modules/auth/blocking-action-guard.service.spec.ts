import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { BlockingActionGuardService } from 'app/modules/auth/blocking-action-guard.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PasswordChangeRequiredDialog } from 'app/pages/credentials/users/password-change-required-dialog/password-change-required-dialog.component';
import { TwoFactorSetupDialog } from 'app/pages/credentials/users/two-factor-setup-dialog/two-factor-setup-dialog.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('BlockingActionGuardService', () => {
  let spectator: SpectatorService<BlockingActionGuardService>;

  const mockIsTwoFactorSetupRequired$ = new BehaviorSubject(false);
  const mockIsPasswordChangeRequired$ = new BehaviorSubject(false);
  const mockIsAuthenticated$ = new BehaviorSubject(false);
  const mockIsFullAdmin$ = new BehaviorSubject(true);

  const mockDialogRef = {
    afterClosed: jest.fn(() => of(true)),
    componentInstance: {},
  };

  const createService = createServiceFactory({
    service: BlockingActionGuardService,
    providers: [
      mockProvider(Router),
      mockProvider(WebSocketStatusService, {
        isAuthenticated$: mockIsAuthenticated$,
      }),
      mockProvider(AuthService, {
        isTwoFactorSetupRequired: jest.fn(() => mockIsTwoFactorSetupRequired$),
        isPasswordChangeRequired$: mockIsPasswordChangeRequired$,
        isFullAdmin: jest.fn(() => mockIsFullAdmin$),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(DialogService, {
        fullScreenDialog: jest.fn(() => of(undefined)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('does not allow route to be accessed when user is not authenticated', async () => {
    expect(
      await firstValueFrom(spectator.service.canActivateChild({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)),
    ).toBe(false);
  });

  it('allows route access when 2FA setup is not required', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(false);

    expect(
      await firstValueFrom(spectator.service.canActivateChild({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)),
    ).toBe(true);
  });

  it('allows two-factor-auth page access for all authorized users', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/two-factor-auth' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);
  });

  it('shows 2FA dialog for full admin accessing system pages when 2FA is required', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);
    mockIsFullAdmin$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/system/upgrade' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(TwoFactorSetupDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });

  it('shows two-factor warning when 2FA is enabled and user has not configured it', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(TwoFactorSetupDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });

  it('shows 2FA dialog only once per session', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);

    const routeSnapshot = {} as ActivatedRouteSnapshot;
    const stateSnapshot = { url: '/dashboard' } as RouterStateSnapshot;

    // First navigation should show dialog
    await firstValueFrom(spectator.service.canActivateChild(routeSnapshot, stateSnapshot));
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(1);

    // Simulate dialog closed
    mockDialogRef.afterClosed.mockReturnValue(of(true));

    // Second navigation should NOT show dialog again (already checked this session)
    await firstValueFrom(spectator.service.canActivateChild(routeSnapshot, { url: '/storage' } as RouterStateSnapshot));

    // Should still be called only once
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(1);
  });

  it('prevents opening multiple two-factor dialogs simultaneously', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);

    const routeSnapshot = {} as ActivatedRouteSnapshot;
    const stateSnapshot = { url: '/dashboard' } as RouterStateSnapshot;

    // First call should open dialog
    const firstCall$ = spectator.service.canActivateChild(routeSnapshot, stateSnapshot);

    // Second call while dialog is open should not open another dialog
    spectator.service.canActivateChild(routeSnapshot, stateSnapshot);

    await firstValueFrom(firstCall$);

    // Should only be called once for the first dialog
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledTimes(1);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(TwoFactorSetupDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });

  it('handles STIG first login for user to proceed with changing one-time password and setting up 2FA', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(true);
    mockIsPasswordChangeRequired$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(TwoFactorSetupDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });

    const isAllowedSecondCheck = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard2' } as RouterStateSnapshot),
    );
    expect(isAllowedSecondCheck).toBe(true);

    expect(spectator.inject(MatDialog).open).not.toHaveBeenCalledWith(PasswordChangeRequiredDialog);
  });

  it('shows password change required dialog when user must change password', async () => {
    mockIsAuthenticated$.next(true);
    mockIsTwoFactorSetupRequired$.next(false);
    mockIsFullAdmin$.next(true);
    mockIsPasswordChangeRequired$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );

    expect(isAllowed).toBe(true);
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(PasswordChangeRequiredDialog, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });
});
