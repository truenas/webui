import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild,
} from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, switchMap, take, forkJoin,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TwoFactorGuardService implements CanActivateChild {
  constructor(
    private router: Router,
    private authService: AuthService,
    private wsStatus: WebSocketStatusService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) { }

  canActivateChild(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.wsStatus.isAuthenticated$.pipe(
      take(1),
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return of(false);
        }
        return this.checkTwoFactorAuth(state);
      }),
    );
  }

  private checkTwoFactorAuth(state: RouterStateSnapshot): Observable<boolean> {
    return forkJoin([
      this.authService.userTwoFactorConfig$.pipe(take(1)),
      this.authService.getGlobalTwoFactorConfig(),
      this.authService.hasRole([Role.FullAdmin]).pipe(take(1)),
    ]).pipe(
      switchMap(([userConfig, globalConfig, isFullAdmin]) => {
        if (!globalConfig.enabled || userConfig.secret_configured || state.url.endsWith('/two-factor-auth')) {
          return of(true);
        }

        // Allow admins to access system settings regardless of 2FA status
        if (isFullAdmin && state.url.startsWith('/system')) {
          return of(true);
        }

        return this.showTwoFactorWarning();
      }),
    );
  }

  private showTwoFactorWarning(): Observable<boolean> {
    return this.dialogService.fullScreenDialog({
      title: this.translate.instant('Two-Factor Authentication Setup Warning!'),
      message: this.translate.instant('Two-Factor Authentication has been enabled on this system. You are required to setup your 2FA authentication on the next page. You will not be able to proceed without setting up 2FA for your account. Make sure to scan the QR code with your authenticator app in the end before logging out of the system or navigating away. Otherwise, you will be locked out of the system and will be unable to login after logging out.'),
      showClose: true,
    }).pipe(
      switchMap(() => {
        this.router.navigate(['/two-factor-auth']);
        return of(false);
      }),
    );
  }
}
