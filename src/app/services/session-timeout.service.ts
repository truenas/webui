import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { format } from 'date-fns';
import {
  filter, Subscription,
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
import { LocaleService } from 'app/modules/language/locale.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

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
  private destroyRef = inject(DestroyRef);

  private actionWaitTimeout: Timeout;
  private debounceTimeout: Timeout;
  private terminateCancelTimeout: Timeout;
  private currentLifetime: number | null = null;
  private preferencesSubscription: Subscription | null = null;
  private warningDialogRef: MatDialogRef<SessionExpiringDialog> | null = null;
  private afterClosedSubscription: Subscription | null = null;

  private readonly defaultLifetime = 300;
  private readonly debounceMs = 1000;

  private onActivity = (): void => {
    // Ignore activity while warning dialog is open — user must explicitly click "Extend session"
    if (this.warningDialogRef) {
      return;
    }

    clearTimeout(this.debounceTimeout);
    this.debounceTimeout = setTimeout(() => this.resetTimer(), this.debounceMs);
  };

  private resetTimer(): void {
    this.pause();
    if (this.warningDialogRef) {
      this.warningDialogRef.close();
      this.warningDialogRef = null;
    }
    const lifetime = this.currentLifetime ?? this.defaultLifetime;
    this.actionWaitTimeout = setTimeout(() => {
      const showWarningDialogFor = 30000;

      this.terminateCancelTimeout = setTimeout(() => {
        this.expireSession();
      }, showWarningDialogFor);

      this.warningDialogRef = this.showWarningDialog(showWarningDialogFor, lifetime);
      this.afterClosedSubscription = this.warningDialogRef.afterClosed()
        .subscribe((shouldExtend) => {
          this.warningDialogRef = null;
          clearTimeout(this.terminateCancelTimeout);
          if (shouldExtend) {
            this.start();
          }
        });
    }, lifetime * 1000);
  }

  constructor() {
    this.matDialog.afterOpened.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((dialog) => {
      if (dialog.componentInstance instanceof JobProgressDialog) {
        this.stop();
        dialog.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          this.start();
        });
      }
    });
  }

  private expireSession(): void {
    this.authService.clearAuthToken();
    this.router.navigate(['/signin']);
    this.dialogService.closeAllDialogs();

    this.authService.logout().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  showSessionExpiredMessage(): void {
    this.snackbar.open({
      message: this.translate.instant('Session expired'),
      icon: tnIconMarker('clock-alert-outline', 'mdi'),
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
    this.resetTimer();
  }

  private subscribeToPreferences(): void {
    this.preferencesSubscription?.unsubscribe();
    this.preferencesSubscription = this.appStore$
      .select(selectPreferences)
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((preferences) => {
        const lifetime = preferences.lifetime || this.defaultLifetime;
        if (this.currentLifetime !== lifetime) {
          const shouldResetTimeout = this.currentLifetime !== null;
          this.currentLifetime = lifetime;
          this.tokenLastUsedService.updateTokenLifetime(lifetime);
          if (shouldResetTimeout) {
            this.resetTimer();
          }
        }
      });
  }

  pause(): void {
    clearTimeout(this.debounceTimeout);
    clearTimeout(this.actionWaitTimeout);
    clearTimeout(this.terminateCancelTimeout);
    this.afterClosedSubscription?.unsubscribe();
    this.afterClosedSubscription = null;
  }

  stop(): void {
    this.removeListeners();
    this.pause();
    if (this.warningDialogRef) {
      this.warningDialogRef.close();
      this.warningDialogRef = null;
    }
    this.preferencesSubscription?.unsubscribe();
    this.preferencesSubscription = null;
  }

  private showWarningDialog(showConfirmTime: number, lifetime: number): MatDialogRef<SessionExpiringDialog> {
    return this.matDialog.open(SessionExpiringDialog, {
      disableClose: true,
      data: {
        title: this.translate.instant('Logout'),
        message: this.translate.instant('It looks like your session has been inactive for more than {lifetime} seconds.<br>\nFor security reasons we will log you out at {time}.', { time: format(new Date(new Date().getTime() + showConfirmTime), this.localeService.getPreferredTimeFormat()), lifetime }),
        buttonText: this.translate.instant('Extend session'),
      } as SessionExpiringDialogOptions,
    });
  }

  private addListeners(): void {
    this.removeListeners();
    this.window.addEventListener('mouseover', this.onActivity, false);
    this.window.addEventListener('keypress', this.onActivity, false);
  }

  private removeListeners(): void {
    this.window.removeEventListener('mouseover', this.onActivity, false);
    this.window.removeEventListener('keypress', this.onActivity, false);
  }
}
