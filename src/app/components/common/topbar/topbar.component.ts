import {
  Component, Input, OnDestroy, OnInit,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobsManagerComponent } from 'app/components/common/dialog/jobs-manager/jobs-manager.component';
import { JobsManagerStore } from 'app/components/common/dialog/jobs-manager/jobs-manager.store';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { LayoutService } from 'app/core/services/layout.service';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { JobState } from 'app/enums/job-state.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import helptext from 'app/helptext/topbar';
import { CoreEvent } from 'app/interfaces/events';
import { HaStatus, HaStatusEvent } from 'app/interfaces/events/ha-status-event.interface';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { ResilveringEvent } from 'app/interfaces/events/resilvering-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import {
  UserPreferencesEvent,
  UserPreferencesReadyEvent,
} from 'app/interfaces/events/user-preferences-event.interface';
import { ResilverData } from 'app/interfaces/resilver-job.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { matchOtherValidator } from 'app/pages/common/entity/entity-form/validators/password-validation/password-validation';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { NotificationAlert, NotificationsService } from 'app/services/notifications.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { Theme, ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AboutDialogComponent } from '../dialog/about/about-dialog.component';
import { DirectoryServicesMonitorComponent } from '../dialog/directory-services-monitor/directory-services-monitor.component';
import { ResilverProgressDialogComponent } from '../dialog/resilver-progress/resilver-progress.component';
import { TruecommandComponent } from '../dialog/truecommand/truecommand.component';

@UntilDestroy()
@Component({
  selector: 'topbar',
  styleUrls: ['./topbar.component.scss'],
  templateUrl: './topbar.component.html',
})
export class TopbarComponent extends ViewControllerComponent implements OnInit, OnDestroy {
  @Input() sidenav: MatSidenav;
  @Input() notificPanel: MatSidenav;

  notifications: NotificationAlert[] = [];

  interval: Interval;
  updateIsDone: Subscription;

  showResilvering = false;
  pendingNetworkChanges = false;
  waitingNetworkCheckin = false;
  resilveringDetails: ResilverData;
  themesMenu: Theme[] = this.themeService.themesMenu;
  currentTheme = 'ix-blue';
  isTaskMangerOpened = false;
  isDirServicesMonitorOpened = false;
  taskDialogRef: MatDialogRef<JobsManagerComponent>;
  dirServicesMonitor: MatDialogRef<DirectoryServicesMonitorComponent>;
  dirServicesStatus: DirectoryServiceState[] = [];
  showDirServicesIcon = false;
  exposeLegacyUI = false;
  ha_status_text: string;
  ha_disabled_reasons: FailoverDisabledReason[] = [];
  is_ha = false;
  upgradeWaitingToFinish = false;
  pendingUpgradeChecked = false;
  sysName = 'TrueNAS CORE';
  hostname: string;
  showWelcome: boolean;
  checkin_remaining: number;
  checkin_interval: Interval;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  private user_check_in_prompted = false;
  mat_tooltips = helptext.mat_tooltips;
  systemType: string;
  isWaiting = false;
  target: Subject<CoreEvent> = new Subject();
  screenSize = 'waiting';
  numberOfRunningJobs$: Observable<number> = this.jobsManagerStore.numberOfRunningJobs$;

  protected tcConnected = false;
  protected tc_queryCall: 'truecommand.config' = 'truecommand.config';
  protected tc_updateCall: 'truecommand.update' = 'truecommand.update';
  protected isTcStatusOpened = false;
  protected tcStatusDialogRef: MatDialogRef<TruecommandComponent>;
  tcStatus: TrueCommandConfig;

  readonly FailoverDisabledReason = FailoverDisabledReason;
  readonly TrueCommandStatus = TrueCommandStatus;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private notificationsService: NotificationsService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private sysGenService: SystemGeneralService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private modalService: ModalService,
    private loader: AppLoaderService,
    private mediaObserver: MediaObserver,
    private layoutService: LayoutService,
    private jobsManagerStore: JobsManagerStore,
  ) {
    super();
    this.sysGenService.updateRunningNoticeSent.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateNotificationSent = true;
    });

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      this.screenSize = evt.mqAlias;
    });
  }

  ngOnInit(): void {
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.checkEULA();

      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((is_ha) => {
        this.is_ha = is_ha;
        if (this.is_ha) {
          window.localStorage.setItem('alias_ips', 'show');
        } else {
          window.localStorage.setItem('alias_ips', '0');
        }
        this.getHAStatus();
      });
      this.sysName = 'TrueNAS ENTERPRISE';
    } else {
      window.localStorage.setItem('alias_ips', '0');
      this.checkLegacyUISetting();
    }
    this.ws.subscribe('core.get_jobs').pipe(untilDestroyed(this)).subscribe((event) => {
      if (event && event.fields.method === 'update.update' || event.fields.method === 'failover.upgrade') {
        this.updateIsRunning = true;
        if (event.fields.state === JobState.Failed || event.fields.state === JobState.Aborted) {
          this.updateIsRunning = false;
          this.systemWillRestart = false;
        }

        // When update starts on HA system, listen for 'finish', then quit listening
        if (this.is_ha) {
          this.updateIsDone = this.sysGenService.updateIsDone$.pipe(untilDestroyed(this)).subscribe(() => {
            this.updateIsRunning = false;
            this.updateIsDone.unsubscribe();
          });
        }
        if (!this.is_ha) {
          if (event && event.fields && event.fields.arguments[0] && (event.fields.arguments[0] as any).reboot) {
            this.systemWillRestart = true;
            if (event.fields.state === JobState.Success) {
              this.router.navigate(['/others/reboot']);
            }
          }
        }

        if (!this.updateNotificationSent) {
          this.updateInProgress();
          this.updateNotificationSent = true;
        }
      }
    });
    const theme = this.themeService.currentTheme();
    this.currentTheme = theme.name;
    this.core.register({ observerClass: this, eventName: 'ThemeListsChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.themesMenu = this.themeService.themesMenu;
    });

    this.ws.call(this.tc_queryCall).pipe(untilDestroyed(this)).subscribe((config) => {
      this.tcStatus = config;
      this.tcConnected = !!config.api_key;
    });
    this.ws.subscribe(this.tc_queryCall).pipe(untilDestroyed(this)).subscribe((event) => {
      this.tcStatus = event.fields;
      this.tcConnected = !!event.fields.api_key;
      if (this.isTcStatusOpened && this.tcStatusDialogRef) {
        this.tcStatusDialogRef.componentInstance.update(this.tcStatus);
      }
    });

    const notifications = this.notificationsService.getNotificationList();

    notifications.forEach((notificationAlert: NotificationAlert) => {
      if (!notificationAlert.dismissed && notificationAlert.level !== AlertLevel.Info) {
        this.notifications.push(notificationAlert);
      }
    });
    this.notificationsService.getNotifications().pipe(untilDestroyed(this)).subscribe((notifications1) => {
      this.notifications = [];
      notifications1.forEach((notificationAlert: NotificationAlert) => {
        if (!notificationAlert.dismissed && notificationAlert.level !== AlertLevel.Info) {
          this.notifications.push(notificationAlert);
        }
      });
    });
    this.checkNetworkChangesPending();
    this.checkNetworkCheckinWaiting();
    this.getDirServicesStatus();
    this.core.register({ observerClass: this, eventName: 'NetworkInterfacesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: NetworkInterfacesChangedEvent) => {
      if (evt && evt.data.commit) {
        this.pendingNetworkChanges = false;
        this.checkNetworkCheckinWaiting();
      } else {
        this.checkNetworkChangesPending();
      }
      if (evt && evt.data.checkin) {
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
        }
      }
    });

    this.core.register({
      observerClass: this,
      eventName: 'Resilvering',
    }).pipe(untilDestroyed(this)).subscribe((evt: ResilveringEvent) => {
      if (evt.data.scan.state == PoolScanState.Finished) {
        this.showResilvering = false;
        this.resilveringDetails = null;
      } else {
        this.resilveringDetails = evt.data;
        this.showResilvering = true;
      }
    });

    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      this.hostname = evt.data.hostname;
    });

    this.sysGenService.getProductType$.pipe(untilDestroyed(this)).subscribe((res) => {
      this.systemType = res;
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });

    this.core.register({ observerClass: this, eventName: 'UserPreferences' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesEvent) => {
      this.preferencesHandler(evt);
    });
    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesReadyEvent) => {
      this.preferencesHandler(evt);
    });
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });

    this.ws.onCloseSubject$.pipe(untilDestroyed(this)).subscribe(() => {
      this.modalService.close('slide-in-form');
    });
  }

  preferencesHandler(evt: UserPreferencesEvent | UserPreferencesReadyEvent): void {
    if (this.isWaiting) {
      this.target.next({ name: 'SubmitComplete', sender: this });
      this.isWaiting = false;
    }
    this.showWelcome = evt.data.showWelcomeDialog && !(localStorage.getItem('turnOffWelcomeDialog') as unknown as boolean);
    if (this.showWelcome) {
      this.onShowAbout();
    }
  }

  checkLegacyUISetting(): void {
    this.sysGenService.getAdvancedConfig$.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.legacy_ui) {
        this.exposeLegacyUI = res.legacy_ui;
        window.localStorage.setItem('exposeLegacyUI', res.legacy_ui as any);
      }
    });
  }

  ngOnDestroy(): void {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }

    this.ws.unsubscribe('failover.disabled_reasons');

    this.core.unregister({ observerClass: this });
  }

  toggleNotificationPanel(): void {
    this.notificPanel.toggle();
  }

  toggleCollapse(): void {
    if (this.layoutService.isMobile) {
      this.sidenav.toggle();
    } else {
      this.sidenav.open();
      this.layoutService.isMenuCollapsed = !this.layoutService.isMenuCollapsed;
    }

    this.core.emit({
      name: 'SidenavStatus',
      data: {
        isOpen: this.sidenav.opened,
        mode: this.sidenav.mode,
        isCollapsed: this.layoutService.isMenuCollapsed,
      },
      sender: this,
    });
  }

  onShowAbout(): void {
    this.dialog.open(AboutDialogComponent, {
      maxWidth: '600px',
      data: {
        extraMsg: this.showWelcome,
        systemType: this.systemType,
      },
      disableClose: true,
    });
  }

  signOut(): void {
    this.ws.logout();
  }

  onShutdown(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Shut down'),
      message: this.translate.instant('Shut down the system?'),
      buttonMsg: this.translate.instant('Shut Down'),
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        return;
      }

      this.router.navigate(['/others/shutdown']);
    });
  }

  onReboot(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Restart'),
      message: this.translate.instant('Restart the system?'),
      buttonMsg: this.translate.instant('Restart'),
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res) {
        return;
      }

      this.router.navigate(['/others/reboot']);
    });
  }

  checkEULA(): void {
    this.ws.call('truenas.is_eula_accepted').pipe(untilDestroyed(this)).subscribe((isEulaAccepted) => {
      if (!isEulaAccepted || window.localStorage.getItem('upgrading_status') === 'upgrading') {
        this.ws.call('truenas.get_eula').pipe(untilDestroyed(this)).subscribe((eula) => {
          this.dialogService.confirm({
            title: T('End User License Agreement - TrueNAS'),
            message: eula,
            hideCheckBox: true,
            buttonMsg: T('I Agree'),
            hideCancel: true,
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            window.localStorage.removeItem('upgrading_status');
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
    this.ws.call('interface.checkin_waiting').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        const seconds = res;
        if (seconds > 0 && this.checkin_remaining == null) {
          this.checkin_remaining = seconds;
          this.checkin_interval = setInterval(() => {
            if (this.checkin_remaining > 0) {
              this.checkin_remaining -= 1;
            } else {
              this.checkin_remaining = null;
              clearInterval(this.checkin_interval);
              window.location.reload(); // should just refresh after the timer goes off
            }
          }, 1000);
        }
        this.waitingNetworkCheckin = true;
        if (!this.user_check_in_prompted) {
          this.user_check_in_prompted = true;
          this.showNetworkCheckinWaiting();
        }
      } else {
        this.waitingNetworkCheckin = false;
        if (this.checkin_interval) {
          clearInterval(this.checkin_interval);
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
      hideCheckBox: true,
      buttonMsg: network_interfaces_helptext.checkin_button,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.user_check_in_prompted = false;
      this.loader.open();
      this.ws.call('interface.checkin').pipe(untilDestroyed(this)).subscribe(() => {
        this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
        this.loader.close();
        this.dialogService.info(
          network_interfaces_helptext.checkin_complete_title,
          network_interfaces_helptext.checkin_complete_message,
          '500px', 'info',
        );
        this.waitingNetworkCheckin = false;
      }, (err) => {
        this.loader.close();
        new EntityUtils().handleWSError(null, err, this.dialogService);
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
        hideCheckBox: true,
        buttonMsg: T('Continue'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.router.navigate(['/network']);
      });
    }
  }

  showResilveringDetails(): void {
    this.dialog.open(ResilverProgressDialogComponent);
  }

  onGoToLegacy(): void {
    this.dialogService.confirm({
      title: T('Warning'),
      message: helptext.legacyUIWarning,
      hideCheckBox: true,
      buttonMsg: T('Continue to Legacy UI'),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      window.location.href = '/legacy/';
    });
  }

  onShowTaskManager(): void {
    if (this.isTaskMangerOpened) {
      this.taskDialogRef.close(true);
    } else {
      this.isTaskMangerOpened = true;
      this.taskDialogRef = this.dialog.open(JobsManagerComponent, {
        width: '400px',
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: {
          top: '48px',
          right: '16px',
        },
      });
    }

    this.taskDialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isTaskMangerOpened = false;
      },
    );
  }

  onShowDirServicesMonitor(): void {
    if (this.isDirServicesMonitorOpened) {
      this.dirServicesMonitor.close(true);
    } else {
      this.isDirServicesMonitorOpened = true;
      this.dirServicesMonitor = this.dialog.open(DirectoryServicesMonitorComponent, {
        width: '400px',
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: {
          top: '48px',
          right: '16px',
        },
      });
    }

    this.dirServicesMonitor.afterClosed().pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isDirServicesMonitorOpened = false;
      },
    );
  }

  updateHAInfo(info: HaStatus): void {
    this.ha_disabled_reasons = info.reasons;
    if (info.status == 'HA Enabled') {
      this.ha_status_text = helptext.ha_status_text_enabled;
      if (!this.pendingUpgradeChecked) {
        this.checkUpgradePending();
      }
    } else {
      this.ha_status_text = helptext.ha_status_text_disabled;
    }
  }

  getHAStatus(): void {
    this.core.register({ observerClass: this, eventName: 'HA_Status' }).pipe(untilDestroyed(this)).subscribe((evt: HaStatusEvent) => {
      this.updateHAInfo(evt.data);
    });
  }

  showHAStatus(): void {
    let reasons = '<ul>\n';
    let ha_icon = 'info';
    let ha_status: string;
    if (this.ha_disabled_reasons.length > 0) {
      ha_status = helptext.ha_status_text_disabled;
      ha_icon = 'warning';
      this.ha_disabled_reasons.forEach((reason) => {
        const reason_text = helptext.ha_disabled_reasons[reason];
        reasons = reasons + '<li>' + this.translate.instant(reason_text) + '</li>\n';
      });
    } else {
      ha_status = helptext.ha_status_text_enabled;
      reasons = reasons + '<li>' + this.translate.instant(helptext.ha_is_enabled) + '</li>\n';
    }
    reasons = reasons + '</ul>';

    this.dialogService.info(ha_status, reasons, '500px', ha_icon, true);
  }

  checkUpgradePending(): void {
    this.ws.call('failover.upgrade_pending').pipe(untilDestroyed(this)).subscribe((res) => {
      this.pendingUpgradeChecked = true;
      this.upgradeWaitingToFinish = res;
      if (res) {
        this.upgradePendingDialog();
      }
    });
  }

  upgradePendingDialog(): void {
    this.dialogService.confirm({
      title: T('Pending Upgrade'),
      message: T('There is an upgrade waiting to finish.'),
      hideCheckBox: true,
      buttonMsg: T('Continue'),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Update') } });
      dialogRef.componentInstance.setCall('failover.upgrade_finish');
      dialogRef.componentInstance.disableProgressValue(true);
      dialogRef.componentInstance.submit();
      dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        dialogRef.close(false);
        this.upgradeWaitingToFinish = false;
      });
      dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((failure: any) => {
        this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
      });
    });
  }

  getDirServicesStatus(): void {
    this.ws.call('directoryservices.get_state').pipe(untilDestroyed(this)).subscribe((res) => {
      this.dirServicesStatus = Object.values(res);
      this.showDSIcon();
    });
    this.ws.subscribe('directoryservices.status').pipe(untilDestroyed(this)).subscribe((res) => {
      this.dirServicesStatus = Object.values(res);
      this.showDSIcon();
    });
  }

  showDSIcon(): void {
    this.showDirServicesIcon = false;
    this.dirServicesStatus.forEach((item) => {
      if (item !== DirectoryServiceState.Disabled) {
        this.showDirServicesIcon = true;
      }
    });
  }

  updateInProgress(): void {
    this.sysGenService.updateRunning.emit('true');
    if (!this.updateNotificationSent) {
      this.showUpdateDialog();
      this.updateNotificationSent = true;
    }
  }

  showUpdateDialog(): void {
    const message = this.is_ha || !this.systemWillRestart
      ? helptext.updateRunning_dialog.message
      : helptext.updateRunning_dialog.message + helptext.updateRunning_dialog.message_pt2;

    this.dialogService.confirm({
      message,
      title: helptext.updateRunning_dialog.title,
      hideCheckBox: true,
      buttonMsg: T('Close'),
      hideCancel: true,
    });
  }

  openIX(): void {
    window.open('https://www.ixsystems.com/', '_blank');
  }

  showTCStatus(): void {
    if (this.tcConnected) {
      this.openStatusDialog();
    } else {
      this.openSignupDialog();
    }
  }

  openSignupDialog(): void {
    const conf: DialogFormConfiguration = {
      title: helptext.signupDialog.title,
      message: helptext.signupDialog.content,
      fieldConfig: [],
      saveButtonText: helptext.signupDialog.connect_btn,
      custActions: [
        {
          id: 'signup',
          name: helptext.signupDialog.singup_btn,
          function: () => {
            window.open('https://portal.ixsystems.com');
            this.dialogService.closeAllDialogs();
          },
        },
      ],
      parent: this,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        entityDialog.dialogRef.close();
        this.updateTC();
      },
    };
    this.dialogService.dialogForm(conf);
  }

  updateTC(): void {
    let updateDialog: EntityDialogComponent;
    const conf: DialogFormConfiguration = {
      title: this.tcConnected ? helptext.updateDialog.title_update : helptext.updateDialog.title_connect,
      fieldConfig: [
        {
          type: 'input',
          name: 'api_key',
          placeholder: helptext.updateDialog.api_placeholder,
          tooltip: helptext.updateDialog.api_tooltip,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.updateDialog.enabled_placeholder,
          tooltip: helptext.updateDialog.enabled_tooltip,
          value: true,
        },
      ],
      custActions: [{
        id: 'deregister',
        name: helptext.tcDeregisterBtn,
        function: () => {
          this.dialogService.generalDialog({
            title: helptext.tcDeregisterDialog.title,
            icon: helptext.tcDeregisterDialog.icon,
            message: helptext.tcDeregisterDialog.message,
            confirmBtnMsg: helptext.tcDeregisterDialog.confirmBtnMsg,
          }).pipe(untilDestroyed(this)).subscribe((res) => {
            if (!res) {
              return;
            }

            this.loader.open();
            this.ws.call(this.tc_updateCall, [{ api_key: null, enabled: false }])
              .pipe(untilDestroyed(this))
              .subscribe(
                () => {
                  this.loader.close();
                  updateDialog.dialogRef.close();
                  this.tcStatusDialogRef.close(true);
                  this.dialogService.generalDialog({
                    title: helptext.deregisterInfoDialog.title,
                    message: helptext.deregisterInfoDialog.message,
                    hideCancel: true,
                  });
                },
                (err) => {
                  this.loader.close();
                  new EntityUtils().handleWSError(this, err, this.dialogService);
                },
              );
          });
        },
      }],
      isCustActionVisible: (actionId: string) => {
        return !(actionId === 'deregister' && !this.tcConnected);
      },
      saveButtonText: this.tcConnected ? helptext.updateDialog.save_btn : helptext.updateDialog.connect_btn,
      parent: this,
      afterInit: (entityDialog: EntityDialogComponent) => {
        updateDialog = entityDialog;
        // load settings
        if (this.tcConnected) {
          Object.keys(this.tcStatus).forEach((key) => {
            const ctrl = entityDialog.formGroup.controls[key];
            if (ctrl) {
              ctrl.setValue(this.tcStatus[key as keyof TrueCommandConfig]);
            }
          });
        }
      },
      customSubmit: (entityDialog: EntityDialogComponent) => {
        this.loader.open();
        this.ws.call(this.tc_updateCall, [entityDialog.formValue]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.loader.close();
            entityDialog.dialogRef.close();
            // only show this for connecting TC
            if (!this.tcConnected) {
              this.dialogService.info(helptext.checkEmailInfoDialog.title, helptext.checkEmailInfoDialog.message, '500px', 'info');
            }
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialogService);
          },
        );
      },
    };
    this.dialogService.dialogForm(conf);
  }

  openStatusDialog(): void {
    const injectData = {
      parent: this,
      data: this.tcStatus,
    };
    if (this.isTcStatusOpened) {
      this.tcStatusDialogRef.close(true);
    } else {
      this.isTcStatusOpened = true;
      this.tcStatusDialogRef = this.dialog.open(TruecommandComponent, {
        width: '400px',
        hasBackdrop: true,
        position: {
          top: '48px',
          right: '0px',
        },
        data: injectData,
      });
    }

    this.tcStatusDialogRef.afterClosed().pipe(untilDestroyed(this)).subscribe(
      () => {
        this.isTcStatusOpened = false;
      },
    );
  }

  stopTCConnecting(): void {
    this.dialogService.generalDialog({
      title: helptext.stopTCConnectingDialog.title,
      icon: helptext.stopTCConnectingDialog.icon,
      message: helptext.stopTCConnectingDialog.message,
      confirmBtnMsg: helptext.stopTCConnectingDialog.confirmBtnMsg,
    }).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.ws.call(this.tc_updateCall, [{ enabled: false }]).pipe(untilDestroyed(this)).subscribe(
          () => {
            this.loader.close();
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this, err, this.dialogService);
          },
        );
      }
    });
  }

  openChangePasswordDialog(): void {
    const conf: DialogFormConfiguration = {
      title: T('Change Password'),
      message: helptext.changePasswordDialog.pw_form_title_name,
      fieldConfig: [
        {
          type: 'input',
          name: 'curr_password',
          placeholder: helptext.changePasswordDialog.pw_current_pw_placeholder,
          inputType: 'password',
          required: true,
          togglePw: true,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.changePasswordDialog.pw_new_pw_placeholder,
          inputType: 'password',
          required: true,
          tooltip: helptext.changePasswordDialog.pw_new_pw_tooltip,
        },
        {
          type: 'input',
          name: 'password_conf',
          placeholder: helptext.changePasswordDialog.pw_confirm_pw_placeholder,
          inputType: 'password',
          required: true,
          validation: [matchOtherValidator('password')],
        },
      ],
      saveButtonText: T('Save'),
      custActions: [],
      parent: this,
      customSubmit: (entityDialog: EntityDialogComponent) => {
        this.loader.open();
        const pwChange = entityDialog.formValue;
        delete pwChange.password_conf;
        entityDialog.dialogRef.close();
        this.ws.call('auth.check_user', ['root', pwChange.curr_password]).pipe(untilDestroyed(this)).subscribe((check) => {
          if (check) {
            delete pwChange.curr_password;
            this.ws.call('user.update', [1, pwChange]).pipe(untilDestroyed(this)).subscribe(() => {
              this.loader.close();
              this.dialogService.info(T('Success'), helptext.changePasswordDialog.pw_updated, '300px', 'info', false);
            }, (res) => {
              this.loader.close();
              this.dialogService.info(T('Error'), res, '300px', 'warning', false);
            });
          } else {
            this.loader.close();
            this.dialogService.info(helptext.changePasswordDialog.pw_invalid_title, helptext.changePasswordDialog.pw_invalid_title, '300px', 'warning', false);
          }
        }, (res) => {
          this.loader.close();
          this.dialogService.info(T('Error'), res, '300px', 'warning', false);
        });
      },
    };
    this.dialogService.dialogForm(conf);
  }

  navExternal(link: string): void {
    window.open(link);
  }
}
