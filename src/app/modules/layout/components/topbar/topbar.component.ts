import {
  Component, OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/topbar';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UpdateDialogComponent } from 'app/modules/common/dialog/update-dialog/update-dialog.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { alertIndicatorPressed, sidenavIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  updateIsDone: Subscription;

  updateDialog: MatDialogRef<UpdateDialogComponent>;
  isFailoverLicensed = false;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  tooltips = helptext.mat_tooltips;

  alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private systemGeneralService: SystemGeneralService,
    private matDialog: MatDialog,
    private store$: Store<AlertSlice>,
  ) {
    this.systemGeneralService.updateRunningNoticeSent.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateNotificationSent = true;
    });
  }

  ngOnInit(): void {
    if (this.systemGeneralService.isEnterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.isFailoverLicensed = isHaLicensed;
      });
    }

    this.store$.select(selectUpdateJob).pipe(untilDestroyed(this)).subscribe((jobs) => {
      const job = jobs[0];
      if (!job) {
        return;
      }

      this.updateIsRunning = true;
      if (job.state === JobState.Failed || job.state === JobState.Aborted) {
        this.updateIsRunning = false;
        this.systemWillRestart = false;
      }

      // When update starts on HA system, listen for 'finish', then quit listening
      if (this.isFailoverLicensed) {
        this.updateIsDone = this.systemGeneralService.updateIsDone$.pipe(untilDestroyed(this)).subscribe(() => {
          this.updateIsRunning = false;
          this.updateIsDone.unsubscribe();
        });
      }
      if (
        !this.isFailoverLicensed
        && job?.arguments[0]
        && (job.arguments[0] as { reboot: boolean }).reboot
      ) {
        this.systemWillRestart = true;
        if (job.state === JobState.Success) {
          this.router.navigate(['/others/reboot'], { skipLocationChange: true });
        }
      }

      if (!this.updateNotificationSent) {
        this.updateInProgress();
        this.updateNotificationSent = true;
      }
    });
  }

  onAlertIndicatorPressed(): void {
    this.store$.dispatch(alertIndicatorPressed());
  }

  onSidenavIndicatorPressed(): void {
    this.store$.dispatch(sidenavIndicatorPressed());
  }

  updateInProgress(): void {
    this.systemGeneralService.updateRunning.emit('true');
    if (!this.updateNotificationSent) {
      this.showUpdateDialog();
      this.updateNotificationSent = true;
    }
  }

  showUpdateDialog(): void {
    const message = this.isFailoverLicensed || !this.systemWillRestart
      ? helptext.updateRunning_dialog.message
      : helptext.updateRunning_dialog.message + helptext.updateRunning_dialog.message_pt2;
    const title = helptext.updateRunning_dialog.title;

    this.updateDialog = this.matDialog.open(UpdateDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
    this.updateDialog.componentInstance.setMessage({ title, message });
  }
}
