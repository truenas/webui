import { Inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, map, of, switchMap, take, tap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { TwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsHaLicensed, selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Injectable()
export class TwoFactorGuardService implements CanActivateChild {
  isAuthenticated = false;
  show2FaWarning = false;

  private globalTwoFactorConfig$ = new BehaviorSubject<TwoFactorConfig>(null);

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(WINDOW) private window: Window,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private ws: WebSocketService,
    private store$: Store<AppState>,
  ) { }

  updateGlobalConfig(): void {
    this.ws.call('auth.twofactor.config').pipe(
      tap((twoFactorConfig) => this.globalTwoFactorConfig$.next(twoFactorConfig)),
      untilDestroyed(this),
    ).subscribe();
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return combineLatest([
      this.getIsHaEnabled(),
      this.store$.select(selectIsUpgradePending).pipe(take(1)),
      this.authService.isAuthenticated$,
      this.authService.user$.pipe(filter(Boolean)),
      this.globalTwoFactorConfig$.pipe(
        tap((config) => {
          if (!config) {
            this.updateGlobalConfig();
          }
        }),
        filter(Boolean),
      ),
    ]).pipe(
      take(1),
      switchMap(([isHaEnabled, isUpgradePending, isAuthenticated, loggedInUser, globalTwoFactorConfig]) => {
        if (!isAuthenticated) {
          return of(false);
        }
        if (isHaEnabled && isUpgradePending) {
          return of(true);
        }
        if (
          globalTwoFactorConfig.enabled
          && !loggedInUser.twofactor_auth_configured
          && !state.url.endsWith('/two-factor-auth')
        ) {
          return this.dialogService.fullScreenDialog(
            this.translateService.instant('Two-Factor Authentication Setup Warning!'),
            this.translateService.instant('Two-Factor Authentication has been enabled on this sytem. You are required to setup your 2FA authentication on the next page. You will not be able to proceed without setting up 2FA for your account. Make sure to scan the QR code with your authenticator app in the end before logging out of the system or navigating away. Otherwise, you will be locked out of the system and will be unable to login after logging out.'),
            true,
          ).pipe(
            switchMap(() => {
              this.router.navigate(['/two-factor-auth']);
              return of(false);
            }),
          );
        }
        return of(true);
      }),
    );
  }

  getIsHaEnabled(): Observable<boolean> {
    return combineLatest([
      this.store$.select(selectIsHaLicensed),
      this.store$.select(selectHaStatus).pipe(filter(Boolean)),
    ]).pipe(
      take(1),
      map(([isHa, { hasHa }]) => isHa && hasHa),
    );
  }
}
