import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild,
} from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  Observable, of, switchMap, take, tap,
  combineLatest,
  EMPTY,
} from 'rxjs';
import { AuthService } from 'app/modules/auth/auth.service';
import { PasswordChangeRequiredDialog } from 'app/pages/credentials/users/password-change-required-dialog/password-change-required-dialog.component';
import { TwoFactorSetupDialog } from 'app/pages/credentials/users/two-factor-setup-dialog/two-factor-setup-dialog.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class BlockingActionGuardService implements CanActivateChild {
  private authService = inject(AuthService);
  private wsStatus = inject(WebSocketStatusService);
  private matDialog = inject(MatDialog);

  private twoFactorDialogOpen = false;

  canActivateChild(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.wsStatus.isAuthenticated$.pipe(
      take(1),
      switchMap((isAuthenticated) => {
        if (!isAuthenticated) {
          return of(false);
        }
        return this.areBlockingActionsRequired(state);
      }),
    );
  }

  private areBlockingActionsRequired(state: RouterStateSnapshot): Observable<boolean> {
    return combineLatest([
      this.authService.isPasswordChangeRequired$.pipe(take(1)),
      this.authService.isTwoFactorSetupRequired(),
      this.authService.isFullAdmin().pipe(take(1)),
    ]).pipe(
      take(1),
      switchMap(([
        isPasswordChangeRequired,
        isTwoFactorSetupRequired,
        isFullAdmin,
      ]) => {
        let twoFactorDialog$: Observable<boolean> = of(true);
        if (isTwoFactorSetupRequired) {
          if (this.isAdminUsingSystemSettings(isFullAdmin, state) || state.url.endsWith('/two-factor-auth')) {
            twoFactorDialog$ = of(true);
          } else if (this.twoFactorDialogOpen) {
            twoFactorDialog$ = EMPTY;
          } else {
            this.twoFactorDialogOpen = true;
            twoFactorDialog$ = this.openFullScreenDialog(TwoFactorSetupDialog).pipe(
              tap(() => this.twoFactorDialogOpen = false),
            );
          }
        }

        let passwordChangeRequired$: Observable<boolean> = of(true);
        if (isPasswordChangeRequired) {
          passwordChangeRequired$ = this.openFullScreenDialog(PasswordChangeRequiredDialog).pipe(
            switchMap(() => twoFactorDialog$),
          );
        }

        return passwordChangeRequired$ ?? (twoFactorDialog$ ?? of(true));
      }),
    );
  }

  private isAdminUsingSystemSettings(isFullAdmin: boolean, state: RouterStateSnapshot): boolean {
    return isFullAdmin && state.url.startsWith('/system');
  }

  private openFullScreenDialog<T>(component: ComponentType<T>): Observable<boolean> {
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
