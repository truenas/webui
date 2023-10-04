import {
  Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { JobState } from 'app/enums/job-state.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import helptext from 'app/helptext/topbar';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { SidenavStatusData } from 'app/interfaces/events/sidenav-status-event.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/common/dialog/resilver-progress/resilver-progress.component';
import { UpdateDialogComponent } from 'app/modules/common/dialog/update-dialog/update-dialog.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { LayoutService } from 'app/services/layout.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectHaStatus, selectIsHaLicensed, selectIsUpgradePending } from 'app/store/ha-info/ha-info.selectors';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';
import { alertIndicatorPressed, sidenavUpdated } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() sidenav: MatSidenav;
  @Output() sidenavStatusChange = new EventEmitter<SidenavStatusData>();

  updateIsDone: Subscription;

  showResilvering = false;
  pendingNetworkChanges = false;
  waitingNetworkCheckin = false;
  updateDialog: MatDialogRef<UpdateDialogComponent>;
  haStatusText: string;
  haDisabledReasons: FailoverDisabledReason[] = [];
  isFailoverLicensed = false;
  upgradeWaitingToFinish = false;
  hostname: string;
  checkinRemaining: number;
  checkinInterval: Interval;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  private userCheckInPrompted = false;
  tooltips = helptext.mat_tooltips;
  screenSize = 'waiting';
  productType: ProductType;

  alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);

  readonly FailoverDisabledReason = FailoverDisabledReason;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private ws: WebSocketService,
    private wsManager: WebsocketConnectionService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private mediaObserver: MediaObserver,
    private layoutService: LayoutService,
    private store$: Store<AlertSlice>,
    private core: CoreService,
    private snackbar: SnackbarService,
    private errorHandler: ErrorHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {
    this.systemGeneralService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.productType = productType;
    });

    this.systemGeneralService.updateRunningNoticeSent.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateNotificationSent = true;
    });

    this.mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      this.screenSize = changes[0].mqAlias;
    });
  }

  ngOnInit(): void {
    if (this.productType === ProductType.ScaleEnterprise) {
      this.checkEula();
      this.listenForUpgradePendingState();

      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.isFailoverLicensed = isHaLicensed;

        if (isHaLicensed) {
          this.getHaStatus();
        }
      });
    }

    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      if (!event || (event.fields.method !== 'update.update' && event.fields.method !== 'failover.upgrade')) {
        return;
      }
      this.updateIsRunning = true;
      if (event.fields.state === JobState.Failed || event.fields.state === JobState.Aborted) {
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
        && event?.fields?.arguments[0]
        && (event.fields.arguments[0] as { reboot: boolean }).reboot
      ) {
        this.systemWillRestart = true;
        if (event.fields.state === JobState.Success) {
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
    this.core.register({ observerClass: this, eventName: 'NetworkInterfacesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: NetworkInterfacesChangedEvent) => {
      if (evt && evt.data.commit) {
        this.pendingNetworkChanges = false;
        this.checkNetworkCheckinWaiting();
      } else {
        this.checkNetworkChangesPending();
      }
      if (evt && evt.data.checkin && this.checkinInterval) {
        clearInterval(this.checkinInterval);
      }
    });

    this.ws.subscribe('zfs.pool.scan').pipe(untilDestroyed(this)).subscribe((resilverJob) => {
      const scan = resilverJob.fields.scan;
      if (scan.function !== PoolScanFunction.Resilver) {
        return;
      }

      this.showResilvering = scan.state !== PoolScanState.Finished;
    });

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      this.hostname = sysInfo.hostname;
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  onAlertIndicatorPressed(): void {
    this.store$.dispatch(alertIndicatorPressed());
  }

  toggleCollapse(): void {
    if (this.layoutService.isMobile) {
      this.sidenav.toggle();
    } else {
      this.sidenav.open();
      this.layoutService.isMenuCollapsed = !this.layoutService.isMenuCollapsed;
    }

    const data: SidenavStatusData = {
      isOpen: this.sidenav.opened,
      mode: this.sidenav.mode,
      isCollapsed: this.layoutService.isMenuCollapsed,
    };

    if (!this.layoutService.isMobile) {
      this.store$.dispatch(sidenavUpdated(data));
    }

    this.sidenavStatusChange.emit(data);
  }

  getLogoIcon(): string {
    const isBlueTheme = this.themeService.activeTheme === 'ix-blue' || this.themeService.activeTheme === 'midnight';
    if (isBlueTheme && this.screenSize === 'xs') {
      return 'ix:logo_mark';
    }
    if (!isBlueTheme && this.screenSize === 'xs') {
      return 'ix:logo_mark_rgb';
    }
    if (isBlueTheme && this.screenSize !== 'xs') {
      return 'ix:logo_full';
    }
    return 'ix:logo_full_rgb';
  }

  checkEula(): void {
    this.ws.call('truenas.is_eula_accepted').pipe(untilDestroyed(this)).subscribe((isEulaAccepted) => {
      if (!isEulaAccepted || this.window.localStorage.getItem('upgrading_status') === 'upgrading') {
        this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
          this.dialogService.confirm({
            title: this.translate.instant('End User License Agreement - TrueNAS'),
            message: eula,
            hideCheckbox: true,
            buttonText: this.translate.instant('I Agree'),
            hideCancel: true,
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            this.window.localStorage.removeItem('upgrading_status');
            this.ws.call('truenas.accept_eula').pipe(untilDestroyed(this)).subscribe();
          });
        });
      }
    });
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
          this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
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

  showResilveringDetails(): void {
    this.dialog.open(ResilverProgressDialogComponent);
  }

  updateHaInfo(info: HaStatus): void {
    this.haDisabledReasons = info.reasons;
    this.haStatusText = info.hasHa ? helptext.ha_status_text_enabled : helptext.ha_status_text_disabled;
  }

  getHaStatus(): void {
    this.store$.select(selectHaStatus).pipe(
      filter((haStatus) => !!haStatus),
      untilDestroyed(this),
    ).subscribe((haStatus) => {
      this.updateHaInfo(haStatus);
    });
  }

  showHaStatus(): void {
    let reasons = '<ul>\n';
    let isWarning = false;
    let haStatus: string;
    if (this.haDisabledReasons.length > 0) {
      haStatus = helptext.ha_status_text_disabled;
      isWarning = true;
      this.haDisabledReasons.forEach((reason) => {
        const reasonText = helptext.ha_disabled_reasons[reason];
        reasons = reasons + '<li>' + this.translate.instant(reasonText) + '</li>\n';
      });
    } else {
      haStatus = helptext.ha_status_text_enabled;
      reasons = reasons + '<li>' + this.translate.instant(helptext.ha_is_enabled) + '</li>\n';
    }
    reasons = reasons + '</ul>';

    if (isWarning) {
      this.dialogService.warn(haStatus, reasons, true);
    } else {
      this.dialogService.info(haStatus, reasons, true);
    }
  }

  upgradePendingDialog(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Pending Upgrade'),
      message: this.translate.instant('There is an upgrade waiting to finish.'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Update') } });
      dialogRef.componentInstance.setCall('failover.upgrade_finish');
      dialogRef.componentInstance.disableProgressValue(true);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.close(false);
        this.upgradeWaitingToFinish = false;
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failure) => {
        this.dialogService.error(this.errorHandler.parseJobError(failure));
      });
    });
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

  openIx(): void {
    this.window.open('https://www.ixsystems.com/', '_blank');
  }

  private listenForUpgradePendingState(): void {
    this.store$.select(selectIsUpgradePending).pipe(filter(Boolean), take(1), untilDestroyed(this)).subscribe(() => {
      this.upgradeWaitingToFinish = true;
      this.upgradePendingDialog();
    });
  }
}
