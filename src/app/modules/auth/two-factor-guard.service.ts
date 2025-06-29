import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild,
} from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  Observable, of, switchMap, take,
  combineLatest,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { FirstLoginDialog } from 'app/pages/credentials/users/first-login-dialog/first-login-dialog.component';
import { PasswordChangeRequiredDialog } from 'app/pages/credentials/users/password-change-required-dialog/password-change-required-dialog.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TwoFactorGuardService implements CanActivateChild {
  constructor(
    private authService: AuthService,
    private wsStatus: WebSocketStatusService,
    private matDialog: MatDialog,
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
    return combineLatest([
      this.authService.isPasswordChangeRequired$.pipe(take(1)),
      this.authService.userTwoFactorConfig$.pipe(take(1)),
      this.authService.getGlobalTwoFactorConfig(),
      this.authService.hasRole([Role.FullAdmin]).pipe(take(1)),
      this.authService.isOtpwUser$.pipe(take(1)),
      this.authService.wasOneTimePasswordChanged$.asObservable().pipe(take(1)),
      this.authService.wasRequiredPasswordChanged$.asObservable().pipe(take(1)),
      this.authService.isLocalUser$,
    ]).pipe(
      take(1),
      switchMap(([
        isPasswordChangeRequired,
        userConfig,
        globalConfig,
        isFullAdmin,
        isOtpwUser,
        wasOtpChanged,
        wasRequiredPasswordChanged,
        isLocalUser,
      ]) => {
        const shouldShowFirstLoginDialog = (
          (isOtpwUser && !wasOtpChanged && isLocalUser)
          || (globalConfig.enabled && !userConfig.secret_configured)
        );

        if (shouldShowFirstLoginDialog) {
          return this.openFullScreenDialog(FirstLoginDialog);
        }

        if (isPasswordChangeRequired && !wasRequiredPasswordChanged && !wasOtpChanged) {
          return this.openFullScreenDialog(PasswordChangeRequiredDialog);
        }

        // Allow admins to access system settings regardless of 2FA status
        if (isFullAdmin && state.url.startsWith('/system')) {
          return of(true);
        }

        if (!globalConfig.enabled || userConfig.secret_configured || state.url.endsWith('/two-factor-auth')) {
          return of(true);
        }

        return of(false);
      }),
    );
  }

  private openFullScreenDialog<T>(component: ComponentType<T>): Observable<boolean> {
    this.matDialog.closeAll();

    const dialogRef = this.matDialog.open(component, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      panelClass: 'full-screen-modal',
      disableClose: true,
    });

    return dialogRef.afterClosed();
  }
}
