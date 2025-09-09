import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import {
  filter, tap,
} from 'rxjs/operators';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({
  providedIn: 'root',
})
export class RebootService {
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);

  /**
   * Multiple dialogs may happen because of multiple events from failover.disabled.reasons.
   */
  private isFailoverPromptOpen = false;
  private isRemotePromptOpen = false;

  promptForRestart(): Observable<unknown> {
    return this.dialog.confirm({
      title: this.translate.instant('FIPS Settings'),
      message: this.translate.instant('Restart is recommended for new FIPS setting to take effect. Would you like to restart now?'),
      buttonText: this.translate.instant('Restart Now'),
    })
      .pipe(
        tap((approved) => {
          if (approved) {
            this.authService.clearAuthToken();
            this.restart();
          }
        }),
      );
  }

  promptForFailover(): Observable<unknown> {
    return of(this.isFailoverPromptOpen).pipe(
      filter((isOpen) => !isOpen),
      switchMap(() => {
        this.isFailoverPromptOpen = true;
        return this.dialog.confirm({
          title: this.translate.instant('FIPS Settings'),
          message: this.translate.instant('Failover is recommended for new FIPS setting to take effect. Would you like to failover now?'),
          buttonText: this.translate.instant('Failover Now'),
        });
      }),
      tap((approved) => {
        this.isFailoverPromptOpen = false;
        if (approved) {
          this.failover();
        }
      }),
    );
  }

  promptForRemoteRestart(): Observable<unknown> {
    return of(this.isRemotePromptOpen).pipe(
      filter((isOpen) => !isOpen),
      switchMap(() => {
        this.isRemotePromptOpen = true;
        return this.dialog.confirm({
          title: this.translate.instant('FIPS Settings'),
          message: this.translate.instant('Restart of a remote system is required for new FIPS setting to take effect. Would you like to restart standby now?'),
          buttonText: this.translate.instant('Restart Standby'),
        });
      }),
      switchMap((approved) => {
        this.isRemotePromptOpen = false;
        if (!approved) {
          return of({});
        }
        return this.restartRemote();
      }),
    );
  }

  restart(reason?: string): void {
    this.router.navigate(['/system-tasks/restart'], {
      skipLocationChange: true,
      queryParams: reason ? { reason } : undefined,
    });
  }

  failover(): void {
    this.router.navigate(['/system-tasks/failover'], { skipLocationChange: true });
  }

  restartRemote(): Observable<unknown> {
    return this.dialog.jobDialog(
      this.api.job('failover.reboot.other_node'),
      { title: this.translate.instant('Restarting Standby') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        tap(() => {
          this.snackbar.success(this.translate.instant('Remote Node Restarted'));
        }),
      );
  }
}
