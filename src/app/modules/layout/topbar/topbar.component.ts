import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal,
} from '@angular/core';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, Observable, Subscription, switchMap, tap,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
import { UpdateDialog } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { GlobalSearchTriggerComponent } from 'app/modules/global-search/components/global-search-trigger/global-search-trigger.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { CheckinIndicatorComponent } from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import {
  DirectoryServicesIndicatorComponent,
} from 'app/modules/layout/topbar/directory-services-indicator/directory-services-indicator.component';
import { HaStatusIconComponent } from 'app/modules/layout/topbar/ha-status-icon/ha-status-icon.component';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { ResilveringIndicatorComponent } from 'app/modules/layout/topbar/resilvering-indicator/resilvering-indicator.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { toolBarElements } from 'app/modules/layout/topbar/topbar.elements';
import { UserMenuComponent } from 'app/modules/layout/topbar/user-menu/user-menu.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { TruenasConnectButtonComponent } from 'app/modules/truenas-connect/truenas-connect-button.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';
import { selectHasConsoleFooter } from 'app/store/system-config/system-config.selectors';
import { alertIndicatorPressed, sidenavIndicatorPressed } from 'app/store/topbar/topbar.actions';
import { TruenasLogoComponent } from './truenas-logo/truenas-logo.component';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    GlobalSearchTriggerComponent,
    CheckinIndicatorComponent,
    ResilveringIndicatorComponent,
    HaStatusIconComponent,
    DirectoryServicesIndicatorComponent,
    JobsIndicatorComponent,
    MatBadge,
    UserMenuComponent,
    PowerMenuComponent,
    AsyncPipe,
    TranslateModule,
    UiSearchDirective,
    TestDirective,
    TruecommandButtonComponent,
    TruenasLogoComponent,
    TruenasConnectButtonComponent,
  ],
})
export class TopbarComponent implements OnInit {
  updateIsDone: Subscription;

  updateDialog: MatDialogRef<UpdateDialog>;
  isFailoverLicensed = false;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  tooltips = helptextTopbar.mat_tooltips;
  protected searchableElements = toolBarElements;

  readonly hasRebootRequiredReasons = signal(false);
  readonly shownDialog = signal(false);
  readonly hasTncConfig = computed(() => {
    const config = this.tnc.config();
    return config?.ips?.length && config.tnc_base_url
      && config.account_service_base_url
      && config.leca_service_base_url;
  });

  readonly alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);

  constructor(
    private router: Router,
    private systemGeneralService: SystemGeneralService,
    private matDialog: MatDialog,
    private store$: Store<AlertSlice>,
    private appStore$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private tnc: TruenasConnectService,
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
        this.updateIsRunning = false;
        this.updateDialog?.close();
        return;
      }

      this.updateIsRunning = true;
      if (job.state === JobState.Failed || job.state === JobState.Aborted) {
        this.updateIsRunning = false;
        this.systemWillRestart = false;
        this.updateDialog?.close();
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
          this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
        }
      }

      if (!this.updateNotificationSent) {
        this.updateInProgress();
        this.updateNotificationSent = true;
      }

      this.cdr.markForCheck();
    });

    this.showRebootInfoDialog();
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
      : this.translate.instant(helptextTopbar.updateRunning_dialog.message)
        + '<br />'
        + this.translate.instant(helptextTopbar.updateRunning_dialog.message_pt2);
    const title = helptextTopbar.updateRunning_dialog.title;

    this.updateDialog = this.matDialog.open(UpdateDialog, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
    this.updateDialog.componentInstance.setMessage({ title, message });
  }

  showRebootInfoDialog(): void {
    this.checkRebootInfo().pipe(untilDestroyed(this)).subscribe(() => {
      this.shownDialog.set(false);
    });
  }

  onFeedbackIndicatorPressed(): void {
    this.matDialog.open(FeedbackDialog);
  }

  private checkRebootInfo(): Observable<unknown> {
    return this.appStore$.select(selectRebootInfo).pipe(
      tap(() => this.hasRebootRequiredReasons.set(false)),
      filter(({ thisNodeRebootInfo, otherNodeRebootInfo }) => {
        return !!thisNodeRebootInfo?.reboot_required_reasons?.length
          || !!otherNodeRebootInfo?.reboot_required_reasons?.length;
      }),
      tap(() => this.hasRebootRequiredReasons.set(true)),
      filter(() => !this.shownDialog()),
      tap(() => this.shownDialog.set(true)),
      switchMap(() => this.matDialog.open(RebootRequiredDialog, { minWidth: '400px' }).afterClosed()),
    );
  }
}
