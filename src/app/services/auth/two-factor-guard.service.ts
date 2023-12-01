import { Inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable, combineLatest, filter, of, switchMap, take, tap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalTwoFactorConfig, UserTwoFactorConfig } from 'app/interfaces/two-factor-config.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Injectable()
export class TwoFactorGuardService implements CanActivateChild {
  private globalTwoFactorConfig$ = new BehaviorSubject<GlobalTwoFactorConfig>(null);
  private userTwoFactorConfig$ = new BehaviorSubject<UserTwoFactorConfig>(null);

  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(WINDOW) private window: Window,
    private dialogService: DialogService,
    private translateService: TranslateService,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private appLoader: AppLoaderService,
  ) { }

  updateGlobalConfig(): void {
    this.authService.getGlobalTwoFactorConfig().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (config) => {
        this.globalTwoFactorConfig$.next(config);
      },
    });
  }

  updateUserConfig(): void {
    this.authService.getUserTwoFactorConfig().pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (config) => {
        this.userTwoFactorConfig$.next(config);
      },
    });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return combineLatest([
      this.authService.isAuthenticated$,
      this.userTwoFactorConfig$.pipe(
        tap((config) => {
          if (!config) {
            this.updateUserConfig();
          }
        }),
        filter(Boolean),
      ),
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
      switchMap(([isAuthenticated, userTwoFactorConfig, globalTwoFactorConfig]) => {
        if (!isAuthenticated) {
          return of(false);
        }
        if (
          globalTwoFactorConfig.enabled
          && !userTwoFactorConfig.secret_configured
          && !state.url.endsWith('/two-factor-auth')
        ) {
          this.appLoader.open('Checking for pending upgrade');
          return this.store$.select(selectIsUpgradePending).pipe(
            take(1),
            switchMap((isUpgradePending) => {
              if (isUpgradePending) {
                this.appLoader.close();
                return of(true);
              }
              return this.dialogService.fullScreenDialog(
                this.translateService.instant('Two-Factor Authentication Setup Warning!'),
                this.translateService.instant('Two-Factor Authentication has been enabled on this system. You are required to setup your 2FA authentication on the next page. You will not be able to proceed without setting up 2FA for your account. Make sure to scan the QR code with your authenticator app in the end before logging out of the system or navigating away. Otherwise, you will be locked out of the system and will be unable to login after logging out.'),
                true,
              ).pipe(
                switchMap(() => {
                  this.appLoader.close();
                  this.router.navigate(['/two-factor-auth']);
                  return of(false);
                }),
              );
            }),
          );
        }
        return of(true);
      }),
    );
  }
}
