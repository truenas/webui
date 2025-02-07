import { MatDialog } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { TwoFactorGuardService } from 'app/modules/auth/two-factor-guard.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FirstLoginDialogComponent } from 'app/pages/credentials/users/first-login-dialog/first-login-dialog.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('TwoFactorGuardService', () => {
  let spectator: SpectatorService<TwoFactorGuardService>;

  const isAuthenticated$ = new BehaviorSubject(false);
  const userTwoFactorConfig$ = new BehaviorSubject<UserTwoFactorConfig | null>(null);
  const getGlobalTwoFactorConfig = jest.fn(() => of(null as GlobalTwoFactorConfig | null));
  const hasRole$ = new BehaviorSubject(false);
  const isOtpwUser$ = new BehaviorSubject(false);
  const wasOneTimePasswordChanged$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: TwoFactorGuardService,
    providers: [
      mockProvider(Router),
      mockProvider(WebSocketStatusService, {
        isAuthenticated$,
      }),
      mockProvider(AuthService, {
        userTwoFactorConfig$,
        getGlobalTwoFactorConfig,
        hasRole: jest.fn(() => hasRole$),
        isOtpwUser$,
        wasOneTimePasswordChanged$,
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
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

  it('allows route access when 2FA is not enabled globally', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: false } as GlobalTwoFactorConfig));

    expect(
      await firstValueFrom(spectator.service.canActivateChild({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)),
    ).toBe(true);
  });

  it('allows route access when 2FA is enabled and user has it configured', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: true } as UserTwoFactorConfig);

    expect(
      await firstValueFrom(spectator.service.canActivateChild({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)),
    ).toBe(true);
  });

  it('allows two-factor-auth page access for all authorized users', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/two-factor-auth' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);
  });

  it('allows system page access for full admin regardless of 2FA status', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);
    hasRole$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/system/upgrade' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);
  });

  it('shows two-factor warning when 2FA is enabled and user has not configured it', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(FirstLoginDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });

  it('handles STIG first login for user to proceed with changing one-time password and setting up 2FA', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);
    isOtpwUser$.next(true);

    const isAllowed = await firstValueFrom(
      spectator.service.canActivateChild({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot),
    );
    expect(isAllowed).toBe(true);

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(FirstLoginDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });
  });
});
