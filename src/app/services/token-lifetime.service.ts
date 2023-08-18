import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { format } from 'date-fns';
import { filter } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Timeout } from 'app/interfaces/timeout.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AuthService } from 'app/services/auth/auth.service';
import { DialogService } from 'app/services/dialog.service';
import { AppState } from 'app/store';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class TokenLifetimeService {
  protected actionWaitTimeout: Timeout;
  protected terminateCancelTimeout: Timeout;
  private resumeBound;

  constructor(
    private dialogService: DialogService,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private authService: AuthService,
    private router: Router,
    private snackbar: MatSnackBar,
    private appStore$: Store<AppState>,
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
          this.router.navigate(['/sessions/signin']);
          this.dialogService.closeAllDialogs();
          this.snackbar.open(
            this.translate.instant('Token expired'),
            this.translate.instant('Close'),
            { duration: 4000, verticalPosition: 'bottom' },
          );
          this.authService.logout().pipe(untilDestroyed(this)).subscribe();
        }, showConfirmTime);
        this.dialogService.confirm({
          title: this.translate.instant('Logout'),
          message: this.translate.instant(`
            It looks like your session has been inactive for more than {lifetime} seconds.<br>
            For security reasons we will log you out at {time}.
          `, { time: format(new Date(new Date().getTime() + showConfirmTime), 'HH:mm:ss'), lifetime }),
          buttonText: this.translate.instant('Extend session'),
          hideCancel: true,
          hideCheckbox: true,
          disableClose: true,
        }).pipe(untilDestroyed(this)).subscribe((isExtend) => {
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
}
