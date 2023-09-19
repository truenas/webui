import {
  Component, Inject, OnInit,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import helptext from 'app/helptext/topbar';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { UpdateDialogComponent } from 'app/modules/common/dialog/update-dialog/update-dialog.component';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';
import { alertIndicatorPressed, sidenavIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  updateIsDone: Subscription;

  pendingNetworkChanges = false;
  waitingNetworkCheckin = false;
  updateDialog: MatDialogRef<UpdateDialogComponent>;
  isFailoverLicensed = false;
  checkinRemaining: number;
  checkinInterval: Interval;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  private userCheckInPrompted = false;
  tooltips = helptext.mat_tooltips;

  alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private store$: Store<AlertSlice>,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    private actions$: Actions,
    @Inject(WINDOW) private window: Window,
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

    this.checkNetworkChangesPending();
    this.checkNetworkCheckinWaiting();

    this.actions$.pipe(ofType(networkInterfacesChanged), untilDestroyed(this))
      .subscribe(({ commit, checkIn }) => {
        if (commit) {
          this.pendingNetworkChanges = false;
          this.checkNetworkCheckinWaiting();
        } else {
          this.checkNetworkChangesPending();
        }
        if (checkIn && this.checkinInterval) {
          clearInterval(this.checkinInterval);
        }
      });
  }

  onAlertIndicatorPressed(): void {
    this.store$.dispatch(alertIndicatorPressed());
  }

  onSidenavIndicatorPressed(): void {
    this.store$.dispatch(sidenavIndicatorPressed());
  }

  checkNetworkChangesPending(): void {
    this.ws.call('interface.has_pending_changes').pipe(untilDestroyed(this)).subscribe((hasPendingChanges) => {
      this.pendingNetworkChanges = hasPendingChanges;
    });
  }

  checkNetworkCheckinWaiting(): void {
    this.ws.call('interface.checkin_waiting').pipe(untilDestroyed(this)).subscribe((checkingSeconds) => {
      if (checkingSeconds !== null) {
        const seconds = checkingSeconds;
        if (seconds > 0 && this.checkinRemaining === null) {
          this.checkinRemaining = seconds;
          this.checkinInterval = setInterval(() => {
            if (this.checkinRemaining > 0) {
              this.checkinRemaining -= 1;
            } else {
              this.checkinRemaining = null;
              clearInterval(this.checkinInterval);
              this.window.location.reload(); // should just refresh after the timer goes off
            }
          }, 1000);
        }
        this.waitingNetworkCheckin = true;
        if (!this.userCheckInPrompted) {
          this.userCheckInPrompted = true;
          this.showNetworkCheckinWaiting();
        }
      } else {
        this.waitingNetworkCheckin = false;
        if (this.checkinInterval) {
          clearInterval(this.checkinInterval);
        }
      }
    });
  }

  showNetworkCheckinWaiting(): void {
    // only popup dialog if not in network page
    if (this.router.url === '/network') {
      return;
    }

    this.dialogService.confirm({
      title: network_interfaces_helptext.checkin_title,
      message: network_interfaces_helptext.pending_checkin_dialog_text,
      hideCheckbox: true,
      buttonText: network_interfaces_helptext.checkin_button,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.userCheckInPrompted = false;
      this.loader.open();
      this.ws.call('interface.checkin').pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: true }));
          this.loader.close();
          this.snackbar.success(
            this.translate.instant(network_interfaces_helptext.checkin_complete_message),
          );
          this.waitingNetworkCheckin = false;
        },
        error: (err: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(err));
        },
      });
    });
  }

  showNetworkChangesPending(): void {
    if (this.waitingNetworkCheckin) {
      this.showNetworkCheckinWaiting();
    } else {
      this.dialogService.confirm({
        title: network_interfaces_helptext.pending_changes_title,
        message: network_interfaces_helptext.pending_changes_message,
        hideCheckbox: true,
        buttonText: this.translate.instant('Continue'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.router.navigate(['/network']);
      });
    }
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

    this.updateDialog = this.dialog.open(UpdateDialogComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
    this.updateDialog.componentInstance.setMessage({ title, message });
  }

  onFeedbackIndicatorPressed(): void {
    this.dialog.open(FeedbackDialogComponent);
  }
}
