import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateChild,
} from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, of, switchMap, take, tap,
  combineLatest,
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
  private dialogRef: MatDialogRef<TwoFactorSetupDialog> | null = null;
  private hasCheckedTwoFactorSetup = false; // Track if we've already checked 2FA this session

  constructor() {
    // Reset dialog state on service initialization
    this.twoFactorDialogOpen = false;
    this.hasCheckedTwoFactorSetup = false;

    // Reset state when user logs out
    this.wsStatus.isAuthenticated$.pipe(
      untilDestroyed(this),
    ).subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.twoFactorDialogOpen = false;
        this.dialogRef = null;
        this.hasCheckedTwoFactorSetup = false; // Reset the check flag on logout
      }
    });
  }

  canActivateChild(_: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Check if we have a stale dialog reference or if the dialog was closed unexpectedly
    if (this.twoFactorDialogOpen) {
      if (!this.dialogRef?.componentInstance) {
        this.twoFactorDialogOpen = false;
        this.dialogRef = null;
      }
    }

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
    ]).pipe(
      take(1),
      switchMap(([
        isPasswordChangeRequired,
        isTwoFactorSetupRequired,
      ]) => {
        let twoFactorDialog$: Observable<boolean> = of(true);

        // Only check 2FA setup once per session
        if (isTwoFactorSetupRequired && !this.hasCheckedTwoFactorSetup) {
          if (state.url.endsWith('/two-factor-auth')) {
            twoFactorDialog$ = of(true);
            this.hasCheckedTwoFactorSetup = true; // Mark as checked even if on 2FA page
          } else if (this.twoFactorDialogOpen) {
            twoFactorDialog$ = of(true);
          } else {
            this.twoFactorDialogOpen = true;
            this.hasCheckedTwoFactorSetup = true; // Mark as checked when dialog opens
            this.dialogRef = this.matDialog.open(TwoFactorSetupDialog, {
              maxWidth: '100vw',
              maxHeight: '100vh',
              height: '100%',
              width: '100%',
              panelClass: 'full-screen-modal',
              disableClose: true,
            });

            twoFactorDialog$ = this.dialogRef.afterClosed().pipe(
              tap({
                next: () => {
                  this.twoFactorDialogOpen = false;
                  this.dialogRef = null;
                },
                error: () => {
                  this.twoFactorDialogOpen = false;
                  this.dialogRef = null;
                },
                complete: () => {
                  this.twoFactorDialogOpen = false;
                  this.dialogRef = null;
                },
              }),
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
