import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, switchMap } from 'rxjs';
import {
  filter, tap,
} from 'rxjs/operators';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';

@Injectable({
  providedIn: 'root',
})
export class FipsService {
  /**
   * Multiple dialogs may happen because of multiple events from failover.disabled.reasons.
   */
  private isFailoverPromptOpen = false;
  private isRemotePromptOpen = false;

  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
    private router: Router,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
  ) {}

  promptForRestart(): Observable<unknown> {
    return this.dialog.confirm({
      title: this.translate.instant('FIPS Settings'),
      message: this.translate.instant('Restart is recommended for new FIPS setting to take effect. Would you like to restart now?'),
      buttonText: this.translate.instant('Restart Now'),
    })
      .pipe(
        tap((approved) => {
          if (approved) {
            this.router.navigate(['/others/reboot'], { skipLocationChange: true });
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
          this.router.navigate(['/others/failover'], { skipLocationChange: true });
        }
      }),
    );
  }

  promptForRemoteRestart(): Observable<boolean> {
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
      tap((approved) => {
        this.isRemotePromptOpen = false;
        if (approved) {
          this.restartRemote();
        }
      }),
    );
  }

  // TODO: Change to return Observable.
  private restartRemote(): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: this.translate.instant('Restarting Standby') },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('failover.reboot.other_node');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.snackbar.success(this.translate.instant('System Security Settings Updated.'));
      dialogRef.close();
    });
  }
}
