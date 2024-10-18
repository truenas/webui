import { Router, RouterStateSnapshot } from '@angular/router';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AuthService } from 'app/services/auth/auth.service';
import { TwoFactorGuardService } from 'app/services/auth/two-factor-guard.service';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';

describe('TwoFactorGuardService', () => {
  let spectator: SpectatorService<TwoFactorGuardService>;

  const isAuthenticated$ = new BehaviorSubject(false);
  const userTwoFactorConfig$ = new BehaviorSubject(null as UserTwoFactorConfig);
  const getGlobalTwoFactorConfig = jest.fn(() => of(null as GlobalTwoFactorConfig));
  const hasRole$ = new BehaviorSubject(false);

  const createService = createServiceFactory({
    service: TwoFactorGuardService,
    providers: [
      mockProvider(Router),
      mockProvider(AuthService, {
        isAuthenticated$,
        userTwoFactorConfig$,
        getGlobalTwoFactorConfig,
        hasRole: jest.fn(() => hasRole$),
      }),
      mockProvider(DialogService, {
        fullScreenDialog: jest.fn(() => of(undefined)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsUpgradePending,
            value: false,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('does not allow route to be accessed when user is not authenticated', async () => {
    expect(await firstValueFrom(spectator.service.canActivateChild(null, null))).toBe(false);
  });

  it('allows route access when 2FA is not enabled globally', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: false } as GlobalTwoFactorConfig));

    expect(await firstValueFrom(spectator.service.canActivateChild(null, null))).toBe(true);
  });

  it('allows route access when 2FA is enabled and user has it configured', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: true } as UserTwoFactorConfig);

    expect(await firstValueFrom(spectator.service.canActivateChild(null, null))).toBe(true);
  });

  it('allows two-factor-auth page access for all authorized users', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);

    const isAllowed = await firstValueFrom(spectator.service.canActivateChild(null, { url: '/two-factor-auth' } as RouterStateSnapshot));
    expect(isAllowed).toBe(true);
  });

  it('allows system page access for full admin regardless of 2FA status', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);
    hasRole$.next(true);

    const isAllowed = await firstValueFrom(spectator.service.canActivateChild(null, { url: '/system/upgrade' } as RouterStateSnapshot));
    expect(isAllowed).toBe(true);
  });

  it('shows two-factor warning when 2FA is enabled and user has not configured it', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);

    const isAllowed = await firstValueFrom(spectator.service.canActivateChild(null, { url: '/dashboard' } as RouterStateSnapshot));
    expect(isAllowed).toBe(false);

    expect(spectator.inject(DialogService).fullScreenDialog).toHaveBeenCalled();
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/two-factor-auth']);
  });

  it('allows route access when upgrade is pending', async () => {
    isAuthenticated$.next(true);
    getGlobalTwoFactorConfig.mockReturnValue(of({ enabled: true } as GlobalTwoFactorConfig));
    userTwoFactorConfig$.next({ secret_configured: false } as UserTwoFactorConfig);

    const mockStore$ = spectator.inject(MockStore);
    mockStore$.overrideSelector(selectIsUpgradePending, true);

    const isAllowed = await firstValueFrom(spectator.service.canActivateChild(null, { url: '/dashboard' } as RouterStateSnapshot));
    expect(isAllowed).toBe(true);
  });
});
