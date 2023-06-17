import { Inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, combineLatest, filter, of, switchMap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Injectable()
export class TwoFactorGuardService implements CanActivateChild {
  isAuthenticated = false;
  show2FaWarning = false;
  constructor(
    private router: Router,
    private authService: AuthService,
    @Inject(WINDOW) private window: Window,
    private dialogService: DialogService,
    private translateService: TranslateService,
  ) {
    this.authService.isAuthenticated$.pipe(untilDestroyed(this)).subscribe((isLoggedIn) => {
      this.isAuthenticated = isLoggedIn;
    });
    this.authService.user$.pipe(filter(Boolean), untilDestroyed(this)).subscribe({
      next: (user) => {
        if (user.globalTwoFactorConfig.enabled && !user.twofactor_auth_configured) {
          this.show2FaWarning = true;
        }
      },
    });
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return combineLatest([
      this.authService.isAuthenticated$,
      this.authService.user$.pipe(filter(Boolean)),
    ]).pipe(
      switchMap(([isAuthenticated, loggedInUser]) => {
        if (!isAuthenticated) {
          return of(false);
        }
        if (
          loggedInUser.globalTwoFactorConfig.enabled
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
}
