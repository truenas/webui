import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import {
  filter, switchMap, tap,
} from 'rxjs';
import { tapOnce } from 'app/helpers/operators/tap-once.operator';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { SessionExpiringDialogComponent } from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppsState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLifetimeService {
  protected actionWaitTimeout: Timeout;
  protected terminateCancelTimeout: Timeout;
  private resumeBound;

  // Check if token was used no more than 15 minutes ago
  get isTokenWithinTimeline(): boolean {
    const tokenLastUsed = this.window.localStorage.getItem('tokenLastUsed');

    if (!tokenLastUsed) {
      return false;
    }

    const tokenLastUsedDate = new Date(tokenLastUsed).getTime();
    const tokenLifetime = 60 * 15 * 1000;
    const currentTime = Date.now();

    return currentTime - tokenLastUsedDate <= tokenLifetime;
  }

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private appStore$: Store<AppsState>,
    private ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.resumeBound = this.resume.bind(this);

    this.matDialog.afterOpened.pipe(untilDestroyed(this)).subscribe((dialog) => {
      if (dialog.componentInstance instanceof EntityJobComponent) {
        this.stop();
        dialog.componentInstance.dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
          this.start();
        });
      }
    });
  }

  start(): void {
    this.setupTokenLastUsedValue();
    this.addListeners();
    this.resume();
  }

  resume(): void {
    this.appStore$.select(selectPreferences).pipe(filter(Boolean), untilDestroyed(this)).subscribe((preferences) => {
      this.pause();
      const lifetime = preferences.lifetime || 300;
      this.actionWaitTimeout = setTimeout(() => {
        this.stop();
        const showConfirmTime = 30000;

        this.terminateCancelTimeout = setTimeout(() => {
          this.authService.clearAuthToken();
          this.router.navigate(['/signin']);
          this.dialogService.closeAllDialogs();
          this.snackbar.open(
            this.translate.instant('Token expired'),
            this.translate.instant('Close'),
            { duration: 4000, verticalPosition: 'bottom' },
          );
          this.authService.logout().pipe(untilDestroyed(this)).subscribe();
        }, showConfirmTime);

        const dialogRef = this.matDialog.open(SessionExpiringDialogComponent, {
          disableClose: true,
          data: {
            title: this.translate.instant('Logout'),
            message: this.translate.instant(`
              It looks like your session has been inactive for more than {lifetime} seconds.<br>
              For security reasons we will log you out at {time}.
            `, { time: format(new Date(new Date().getTime() + showConfirmTime), 'HH:mm:ss'), lifetime }),
            buttonText: this.translate.instant('Extend session'),
          },
        });

        dialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe((isExtend) => {
          clearTimeout(this.terminateCancelTimeout);
          if (isExtend) {
            this.start();
          }
        });
      }, lifetime * 1000);
    });
  }

  pause(): void {
    if (this.actionWaitTimeout) {
      clearTimeout(this.actionWaitTimeout);
    }
  }

  stop(): void {
    this.removeListeners();
    this.pause();
  }

  addListeners(): void {
    this.window.addEventListener('mouseover', this.resumeBound, false);
    this.window.addEventListener('keypress', this.resumeBound, false);
  }

  removeListeners(): void {
    this.window.removeEventListener('mouseover', this.resumeBound, false);
    this.window.removeEventListener('keypress', this.resumeBound, false);
  }

  setupTokenLastUsedValue(): void {
    this.authService.user$.pipe(
      filter(Boolean),
      tapOnce(() => this.updateTokenLastUsed()),
      switchMap(() => this.ws.getDebouncedWebSocketStream$()),
      tap(() => this.updateTokenLastUsed()),
    ).subscribe();
  }

  updateTokenLastUsed(): void {
    this.window.localStorage.setItem('tokenLastUsed', new Date().toISOString());
  }
}
