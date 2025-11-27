import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import {
  filter, Observable, Subscription,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { JobProgressDialog } from 'app/modules/dialog/components/job-progress/job-progress-dialog.component';
import {
  SessionExpiringDialog,
  SessionExpiringDialogOptions,
} from 'app/modules/dialog/components/session-expiring-dialog/session-expiring-dialog.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { LocaleService } from 'app/modules/language/locale.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService {
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private appStore$ = inject<Store<AppState>>(Store);
  private tokenLastUsedService = inject(TokenLastUsedService);
  private window = inject<Window>(WINDOW);
  private localeService = inject(LocaleService);

  protected actionWaitTimeout: Timeout;
  protected terminateCancelTimeout: Timeout;
  private currentLifetime: number | null = null;
  private preferencesSubscription: Subscription | null = null;
  private isResumeActive = false;

  private readonly defaultLifetime = 300;

  private resume = (): void => {
    if (this.isResumeActive) {
      return;
    }

    this.pause();
    this.isResumeActive = true;
    const lifetime = this.currentLifetime ?? this.defaultLifetime;
    this.actionWaitTimeout = setTimeout(() => {
      this.isResumeActive = false;
      this.removeListeners();
      const showWarningDialogFor = 30000;

      this.terminateCancelTimeout = setTimeout(() => {
        this.expireSession();
      }, showWarningDialogFor);

      this.showWarningDialog(showWarningDialogFor, lifetime)
        .pipe(untilDestroyed(this))
        .subscribe((shouldExtend) => {
          clearTimeout(this.terminateCancelTimeout);
          if (shouldExtend) {
            this.start();
          }
        });
    }, lifetime * 1000);
  };

  constructor() {
    this.matDialog.afterOpened.pipe(untilDestroyed(this)).subscribe((dialog) => {
      if (dialog.componentInstance instanceof JobProgressDialog) {
        this.stop();
        dialog.afterClosed().pipe(untilDestroyed(this)).subscribe(() => {
          this.start();
        });
      }
    });
  }

  private expireSession(): void {
    this.authService.clearAuthToken();
    this.router.navigate(['/signin']);
    this.dialogService.closeAllDialogs();

    this.authService.logout().pipe(untilDestroyed(this)).subscribe();
  }

  showSessionExpiredMessage(): void {
    this.snackbar.open({
      message: this.translate.instant('Session expired'),
      icon: iconMarker('mdi-clock-alert-outline'),
      iconCssColor: 'var(--orange)',
      button: {
        title: this.translate.instant('Close'),
      },
    });
  }

  start(): void {
    this.tokenLastUsedService.setupTokenLastUsedValue(this.authService.user$);
    this.subscribeToPreferences();
    this.addListeners();
    this.resume();
  }

  private subscribeToPreferences(): void {
    this.preferencesSubscription?.unsubscribe();
    this.preferencesSubscription = this.appStore$
      .select(selectPreferences)
      .pipe(filter(Boolean))
      .subscribe((preferences) => {
        const lifetime = preferences.lifetime || this.defaultLifetime;
        if (this.currentLifetime !== lifetime) {
          const shouldResetTimeout = this.currentLifetime !== null;
          this.currentLifetime = lifetime;
          this.tokenLastUsedService.updateTokenLifetime(lifetime);
          if (shouldResetTimeout) {
            this.resume();
          }
        }
      });
  }

  pause(): void {
    this.isResumeActive = false;
    if (this.actionWaitTimeout) {
      clearTimeout(this.actionWaitTimeout);
    }
  }

  stop(): void {
    this.removeListeners();
    this.pause();
    this.preferencesSubscription?.unsubscribe();
    this.preferencesSubscription = null;
  }

  private showWarningDialog(showConfirmTime: number, lifetime: number): Observable<boolean> {
    const dialogRef = this.matDialog.open(SessionExpiringDialog, {
      disableClose: true,
      data: {
        title: this.translate.instant('Logout'),
        message: this.translate.instant(`
              It looks like your session has been inactive for more than {lifetime} seconds.<br>
              For security reasons we will log you out at {time}.
            `, { time: format(new Date(new Date().getTime() + showConfirmTime), this.localeService.getPreferredTimeFormat()), lifetime }),
        buttonText: this.translate.instant('Extend session'),
      } as SessionExpiringDialogOptions,
    });

    return dialogRef.afterClosed();
  }

  private addListeners(): void {
    this.window.addEventListener('mouseover', this.resume, false);
    this.window.addEventListener('keypress', this.resume, false);
  }

  private removeListeners(): void {
    this.window.removeEventListener('mouseover', this.resume, false);
    this.window.removeEventListener('keypress', this.resume, false);
  }
}
