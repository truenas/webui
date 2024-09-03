import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UpdateDialogComponent } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { toolBarElements } from 'app/modules/layout/components/topbar/topbar.elements';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectHasConsoleFooter } from 'app/store/system-config/system-config.selectors';
import { alertIndicatorPressed, sidenavIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements OnInit {
  updateIsDone: Subscription;

  updateDialog: MatDialogRef<UpdateDialogComponent>;
  isFailoverLicensed = false;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  tooltips = helptextTopbar.mat_tooltips;
  protected searchableElements = toolBarElements;

  readonly alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private systemGeneralService: SystemGeneralService,
    private matDialog: MatDialog,
    private store$: Store<AlertSlice>,
    private cdr: ChangeDetectorRef,
  ) {
    this.systemGeneralService.updateRunningNoticeSent.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateNotificationSent = true;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    if (this.systemGeneralService.isEnterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.isFailoverLicensed = isHaLicensed;
        this.cdr.markForCheck();
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
          this.router.navigate(['/system-tasks/reboot'], { skipLocationChange: true });
        }
      }

      if (!this.updateNotificationSent) {
        this.updateInProgress();
        this.updateNotificationSent = true;
      }

      this.cdr.markForCheck();
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
      ? helptextTopbar.updateRunning_dialog.message
      : helptextTopbar.updateRunning_dialog.message + helptextTopbar.updateRunning_dialog.message_pt2;
    const title = helptextTopbar.updateRunning_dialog.title;

    this.updateDialog = this.matDialog.open(UpdateDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
    this.updateDialog.componentInstance.setMessage({ title, message });
  }

  onFeedbackIndicatorPressed(): void {
    this.matDialog.open(FeedbackDialogComponent);
  }
}
