import {
  Component, EventEmitter, Input, OnDestroy, OnInit, Output,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { CoreEvent } from 'app/core/services/core.service';
import { Subscription, interval, Subject } from 'rxjs';
import * as domHelper from '../../../helpers/dom.helper';
import network_interfaces_helptext from '../../../helptext/network/interfaces/interfaces-list';
import helptext from '../../../helptext/topbar';
import { EntityJobComponent } from '../../../pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../../pages/common/entity/utils';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import { LanguageService } from '../../../services/language.service';
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { RestService } from '../../../services/rest.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { SystemGeneralService } from '../../../services/system-general.service';
import { Theme, ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { T } from '../../../translate-marker';
import { AboutModalDialog } from '../dialog/about/about-dialog.component';
import { DirectoryServicesMonitorComponent } from '../dialog/directory-services-monitor/directory-services-monitor.component';
import { TaskManagerComponent } from '../dialog/task-manager/task-manager.component';
import { FlexLayoutModule, MediaObserver } from '@angular/flex-layout';
import { DialogFormConfiguration } from '../../../pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { TruecommandComponent } from '../dialog/truecommand/truecommand.component';
import { ResilverProgressDialogComponent } from '../dialog/resilver-progress/resilver-progress.component';

@Component({
  selector: 'topbar',
  styleUrls: ['./topbar.component.css'],
  templateUrl: './topbar.template.html',
})
export class TopbarComponent extends ViewControllerComponent implements OnInit, OnDestroy {
  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];
  @Output() onLangChange = new EventEmitter<any>();

  interval: any;
  updateIsDone: Subscription;

  showResilvering = false;
  pendingNetworkChanges = false;
  waitingNetworkCheckin = false;
  resilveringDetails;
  themesMenu: Theme[] = this.themeService.themesMenu;
  currentTheme = 'ix-blue';
  createThemeLabel = 'Create Theme';
  isTaskMangerOpened = false;
  isDirServicesMonitorOpened = false;
  taskDialogRef: MatDialogRef<TaskManagerComponent>;
  dirServicesMonitor: MatDialogRef<DirectoryServicesMonitorComponent>;
  dirServicesStatus = [];
  showDirServicesIcon = false;
  exposeLegacyUI = false;
  ha_status_text: string;
  ha_disabled_reasons = [];
  ha_pending = false;
  is_ha = false;
  upgradeWaitingToFinish = false;
  pendingUpgradeChecked = false;
  sysName = 'TrueNAS CORE';
  hostname: string;
  showWelcome: boolean;
  checkin_remaining: any;
  checkin_interval: any;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  private user_check_in_prompted = false;
  mat_tooltips = helptext.mat_tooltips;
  systemType: string;
  isWaiting = false;
  target: Subject<CoreEvent> = new Subject();
  screenSize = 'waiting';

  protected dialogRef: any;
  protected tcConnected = false;
  protected tc_queryCall = 'truecommand.config';
  protected tc_updateCall = 'truecommand.update';
  protected isTcStatusOpened = false;
  protected tcStatusDialogRef: MatDialogRef<TruecommandComponent>;
  tcStatus;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private notificationsService: NotificationsService,
    private ws: WebSocketService,
    public language: LanguageService,
    private dialogService: DialogService,
    public sysGenService: SystemGeneralService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private prefServices: PreferencesService,
    protected loader: AppLoaderService,
    public mediaObserver: MediaObserver,
  ) {
    super();
    this.sysGenService.updateRunningNoticeSent.subscribe(() => {
      this.updateNotificationSent = true;
    });

    mediaObserver.media$.subscribe((evt) => {
      this.screenSize = evt.mqAlias;
    });
  }

  ngOnInit() {
    if (window.localStorage.getItem('product_type') === 'ENTERPRISE') {
      this.checkEULA();

      this.ws.call('failover.licensed').subscribe((is_ha) => {
        this.is_ha = is_ha;
        this.is_ha ? window.localStorage.setItem('alias_ips', 'show') : window.localStorage.setItem('alias_ips', '0');
        this.getHAStatus();
      });
      this.sysName = 'TrueNAS ENTERPRISE';
    } else {
      window.localStorage.setItem('alias_ips', '0');
      this.checkLegacyUISetting();
    }
    this.ws.subscribe('core.get_jobs').subscribe((res) => {
      if (res && res.fields.method === 'update.update' || res.fields.method === 'failover.upgrade') {
        this.updateIsRunning = true;
        if (res.fields.state === 'FAILED' || res.fields.state === 'ABORTED') {
          this.updateIsRunning = false;
          this.systemWillRestart = false;
        }

        // When update starts on HA system, listen for 'finish', then quit listening
        if (this.is_ha) {
          this.updateIsDone = this.sysGenService.updateIsDone$.subscribe(() => {
            this.updateIsRunning = false;
            this.updateIsDone.unsubscribe();
          });
        }
        if (!this.is_ha) {
          if (res && res.fields && res.fields.arguments[0] && res.fields.arguments[0].reboot) {
            this.systemWillRestart = true;
            if (res.fields.state === 'SUCCESS') {
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
    this.core.register({ observerClass: this, eventName: 'ThemeListsChanged' }).subscribe((evt: CoreEvent) => {
      this.themesMenu = this.themeService.themesMenu;
    });

    this.ws.call(this.tc_queryCall).subscribe((res) => {
      this.tcStatus = res;
      this.tcConnected = !!res.api_key;
    });
    this.ws.subscribe(this.tc_queryCall).subscribe((res) => {
      this.tcStatus = res.fields;
      this.tcConnected = !!res.fields.api_key;
      if (this.isTcStatusOpened && this.tcStatusDialogRef) {
        this.tcStatusDialogRef.componentInstance.update(this.tcStatus);
      }
    });

    const notifications = this.notificationsService.getNotificationList();

    notifications.forEach((notificationAlert: NotificationAlert) => {
      if (notificationAlert.dismissed === false && notificationAlert.level !== 'INFO') {
        this.notifications.push(notificationAlert);
      }
    });
    this.notificationsService.getNotifications().subscribe((notifications1) => {
      this.notifications = [];
      notifications1.forEach((notificationAlert: NotificationAlert) => {
        if (notificationAlert.dismissed === false && notificationAlert.level !== 'INFO') {
          this.notifications.push(notificationAlert);
        }
      });
    });
    this.checkNetworkChangesPending();
    this.checkNetworkCheckinWaiting();
    this.getDirServicesStatus();
    this.core.register({ observerClass: this, eventName: 'NetworkInterfacesChanged' }).subscribe((evt: CoreEvent) => {
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
    }).subscribe((evt: CoreEvent) => {
      if (evt.data.scan.state == 'FINISHED') {
        this.showResilvering = false;
        this.resilveringDetails = '';
      } else {
        this.resilveringDetails = evt.data;
        this.showResilvering = true;
      }
    });

    this.core.register({
      observerClass: this,
      eventName: 'SysInfo',
    }).subscribe((evt: CoreEvent) => {
      this.hostname = evt.data.hostname;
    });

    this.ws.call('system.product_type').subscribe((res) => {
      this.systemType = res;
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });

    this.core.register({ observerClass: this, eventName: 'UserPreferences' }).subscribe((evt: CoreEvent) => {
      this.preferencesHandler(evt);
    });
    this.core.register({ observerClass: this, eventName: 'UserPreferencesReady' }).subscribe((evt: CoreEvent) => {
      this.preferencesHandler(evt);
    });
    this.core.emit({ name: 'UserPreferencesRequest', sender: this });
  }

  preferencesHandler(evt: CoreEvent) {
    if (this.isWaiting) {
      this.target.next({ name: 'SubmitComplete', sender: this });
      this.isWaiting = false;
    }
  }

  checkLegacyUISetting() {
    this.ws.call('system.advanced.config').subscribe((res) => {
      if (res.legacy_ui) {
        this.exposeLegacyUI = res.legacy_ui;
        window.localStorage.setItem('exposeLegacyUI', res.legacy_ui);
      }
    });
  }

  ngOnDestroy() {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }

    this.ws.unsubscribe('failover.disabled_reasons');

    this.core.unregister({ observerClass: this });
  }

  setLang(lang) {
    this.language.currentLanguage = lang;
    this.onLangChange.emit(this.language.currentLanguage);
  }

  toggleNotific() {
    this.notificPanel.toggle();
  }

  toggleSidenav() {
    this.sidenav.toggle();
    this.core.emit({ name: 'SidenavStatus', data: { isOpen: this.sidenav.opened, mode: this.sidenav.mode, isCollapsed: this.getCollapsedState() }, sender: this });
  }

  toggleCollapse() {
    const appBody = document.body;

    domHelper.toggleClass(appBody, 'collapsed-menu');
    domHelper.removeClass(document.getElementsByClassName('has-submenu'), 'open');
    this.core.emit({ name: 'SidenavStatus', data: { isOpen: this.sidenav.opened, mode: this.sidenav.mode, isCollapsed: this.getCollapsedState() }, sender: this });
  }

  getCollapsedState(): boolean {
    const isCollapsed = document.getElementsByClassName('collapsed-menu').length == 1;
    return isCollapsed;
  }

  onShowAbout() {
    this.dialog.open(AboutModalDialog, {
      maxWidth: '600px',
      data: {
        extraMsg: this.showWelcome,
        systemType: this.systemType,
      },
      disableClose: true,
    });
  }

  signOut() {
    this.ws.logout();
  }

  onShutdown() {
    this.translate.get('Shut down').subscribe((shutdown: string) => {
      this.translate.get('Shut down the system?').subscribe((shutdown_prompt: string) => {
        this.dialogService.confirm({
          title: shutdown,
          message: shutdown_prompt,
          hideCheckBox: false,
          buttonMsg: T('Shut Down'),
        }).subscribe((res) => {
          if (res) {
            this.router.navigate(['/others/shutdown']);
          }
        });
      });
    });
  }

  onReboot() {
    this.translate.get('Restart').subscribe((reboot: string) => {
      this.translate.get('Restart the system?').subscribe((reboot_prompt: string) => {
        this.dialogService.confirm(reboot, reboot_prompt, false, T('Restart')).subscribe((res) => {
          if (res) {
            this.router.navigate(['/others/reboot']);
          }
        });
      });
    });
  }

  checkEULA() {
    this.ws.call('truenas.is_eula_accepted').subscribe((eula_accepted) => {
      if (!eula_accepted || window.localStorage.getItem('upgrading_status') === 'upgrading') {
        this.ws.call('truenas.get_eula').subscribe((eula) => {
          this.dialogService.confirm(T('End User License Agreement - TrueNAS'), eula, true,
            T('I Agree'), false, null, '', null, null, true).subscribe((accept_eula) => {
            if (accept_eula) {
              window.localStorage.removeItem('upgrading_status');
              this.ws.call('truenas.accept_eula')
                .subscribe(),
              (err) => { console.error(err); };
            }
          });
        });
      }
    });
  }

  checkNetworkChangesPending() {
    this.ws.call('interface.has_pending_changes').subscribe((res) => {
      this.pendingNetworkChanges = res;
    });
  }

  checkNetworkCheckinWaiting() {
    this.ws.call('interface.checkin_waiting').subscribe((res) => {
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

  showNetworkCheckinWaiting() {
    // only popup dialog if not in network/interfaces page
    if (this.router.url !== '/network/interfaces') {
      this.dialogService.confirm(
        network_interfaces_helptext.checkin_title,
        network_interfaces_helptext.pending_checkin_dialog_text,
        true, network_interfaces_helptext.checkin_button,
      ).subscribe((res) => {
        if (res) {
          this.user_check_in_prompted = false;
          this.loader.open();
          this.ws.call('interface.checkin').subscribe((success) => {
            this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
            this.loader.close();
            this.dialogService.report(
              network_interfaces_helptext.checkin_complete_title,
              network_interfaces_helptext.checkin_complete_message,
              '500px', 'info',
            );
            this.waitingNetworkCheckin = false;
          }, (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(null, err, this.dialogService);
          });
        }
      });
    }
  }

  showNetworkChangesPending() {
    if (this.waitingNetworkCheckin) {
      this.showNetworkCheckinWaiting();
    } else {
      this.dialogService.confirm(
        network_interfaces_helptext.pending_changes_title,
        network_interfaces_helptext.pending_changes_message,
        true, T('Continue'),
      ).subscribe((res) => {
        if (res) {
          this.router.navigate(['/network/interfaces']);
        }
      });
    }
  }

  showResilveringDetails() {
    this.dialogRef = this.dialog.open(ResilverProgressDialogComponent);
  }

  onGoToLegacy() {
    this.dialogService.confirm(T('Warning'),
      helptext.legacyUIWarning,
      true, T('Continue to Legacy UI')).subscribe((res) => {
      if (res) {
        window.location.href = '/legacy/';
      }
    });
  }

  onShowTaskManager() {
    if (this.isTaskMangerOpened) {
      this.taskDialogRef.close(true);
    } else {
      this.isTaskMangerOpened = true;
      this.taskDialogRef = this.dialog.open(TaskManagerComponent, {
        disableClose: false,
        width: '400px',
        hasBackdrop: true,
        position: {
          top: '48px',
          right: '0px',
        },
      });
    }

    this.taskDialogRef.afterClosed().subscribe(
      (res) => {
        this.isTaskMangerOpened = false;
      },
    );
  }

  onShowDirServicesMonitor() {
    if (this.isDirServicesMonitorOpened) {
      this.dirServicesMonitor.close(true);
    } else {
      this.isDirServicesMonitorOpened = true;
      this.dirServicesMonitor = this.dialog.open(DirectoryServicesMonitorComponent, {
        disableClose: false,
        width: '400px',
        hasBackdrop: true,
        position: {
          top: '48px',
          right: '0px',
        },
      });
    }

    this.dirServicesMonitor.afterClosed().subscribe(
      (res) => {
        this.isDirServicesMonitorOpened = false;
      },
    );
  }

  updateHAInfo(info) {
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

  getHAStatus() {
    this.core.register({ observerClass: this, eventName: 'HA_Status' }).subscribe((evt: CoreEvent) => {
      this.updateHAInfo(evt.data);
    });
  }

  showHAStatus() {
    let reasons = '<ul>\n';
    let ha_icon = 'info';
    let ha_status = '';
    if (this.ha_disabled_reasons.length > 0) {
      ha_status = helptext.ha_status_text_disabled;
      ha_icon = 'warning';
      for (let i = 0; i < this.ha_disabled_reasons.length; i++) {
        const reason_text = helptext.ha_disabled_reasons[this.ha_disabled_reasons[i]];
        this.translate.get(reason_text).subscribe((reason) => {
          reasons = reasons + '<li>' + reason_text + '</li>\n';
        });
      }
    } else {
      ha_status = helptext.ha_status_text_enabled;
      this.translate.get(helptext.ha_is_enabled).subscribe((ha_is_enabled) => {
        reasons = reasons + '<li>' + ha_is_enabled + '</li>\n';
      });
    }
    reasons = reasons + '</ul>';

    this.dialogService.report(ha_status, reasons, '500px', ha_icon, true);
  }

  checkUpgradePending() {
    this.pendingUpgradeChecked = true;
    this.ws.call('failover.upgrade_pending').subscribe((res) => {
      this.upgradeWaitingToFinish = res;
      if (res) {
        this.upgradePendingDialog();
      }
    });
  }

  upgradePendingDialog() {
    this.dialogService.confirm(
      T('Pending Upgrade'),
      T('There is an upgrade waiting to finish.'),
      true, T('Continue'),
    ).subscribe((res) => {
      if (res) {
        this.dialogRef = this.dialog.open(EntityJobComponent, { data: { title: T('Update') }, disableClose: false });
        this.dialogRef.componentInstance.setCall('failover.upgrade_finish');
        this.dialogRef.componentInstance.disableProgressValue(true);
        this.dialogRef.componentInstance.submit();
        this.dialogRef.componentInstance.success.subscribe((success) => {
          this.dialogRef.close(false);
          console.info('success', success);
          this.upgradeWaitingToFinish = false;
        });
        this.dialogRef.componentInstance.failure.subscribe((failure) => {
          this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
        });
      }
    });
  }

  getDirServicesStatus() {
    this.ws.call('directoryservices.get_state').subscribe((res) => {
      for (const i in res) {
        this.dirServicesStatus.push(res[i]);
      }
      this.showDSIcon();
    });
    this.ws.subscribe('directoryservices.status').subscribe((res) => {
      this.dirServicesStatus = [];
      for (const i in res.fields) {
        this.dirServicesStatus.push(res.fields[i]);
      }
      this.showDSIcon();
    });
  }

  showDSIcon() {
    this.showDirServicesIcon = false;
    this.dirServicesStatus.forEach((item) => {
      if (item !== 'DISABLED') {
        this.showDirServicesIcon = true;
      }
    });
  }

  updateInProgress() {
    this.sysGenService.updateRunning.emit('true');
    if (!this.updateNotificationSent) {
      this.showUpdateDialog();
      this.updateNotificationSent = true;
    }
  }

  showUpdateDialog() {
    const message = this.is_ha || !this.systemWillRestart ? helptext.updateRunning_dialog.message
      : helptext.updateRunning_dialog.message + helptext.updateRunning_dialog.message_pt2;
    this.dialogService.confirm(helptext.updateRunning_dialog.title,
      message,
      true, T('Close'), false, '', '', '', '', true);
  }

  openIX() {
    window.open('https://www.ixsystems.com/', '_blank');
  }

  showTCStatus() {
    this.tcConnected ? this.openStatusDialog() : this.openSignupDialog();
  }

  openSignupDialog() {
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
      customSubmit(entityDialog) {
        entityDialog.dialogRef.close();
        entityDialog.parent.updateTC();
      },
    };
    this.dialogService.dialogForm(conf);
  }

  updateTC() {
    const self = this;
    let updateDialog;
    const conf: DialogFormConfiguration = {
      title: self.tcConnected ? helptext.updateDialog.title_update : helptext.updateDialog.title_connect,
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
          self.dialogService.generalDialog({
            title: helptext.tcDeregisterDialog.title,
            icon: helptext.tcDeregisterDialog.icon,
            message: helptext.tcDeregisterDialog.message,
            confirmBtnMsg: helptext.tcDeregisterDialog.confirmBtnMsg,
          }).subscribe((res) => {
            if (res) {
              self.loader.open();
              self.ws.call(self.tc_updateCall, [{ api_key: null, enabled: false }]).subscribe(
                (wsRes) => {
                  self.loader.close();
                  updateDialog.dialogRef.close();
                  self.tcStatusDialogRef.close(true);
                  self.dialogService.generalDialog({
                    title: helptext.deregisterInfoDialog.title,
                    message: helptext.deregisterInfoDialog.message,
                    hideCancel: true,
                  });
                },
                (err) => {
                  self.loader.close();
                  new EntityUtils().handleWSError(updateDialog.parent, err, updateDialog.parent.dialogService);
                },
              );
            }
          });
        },
      }],
      isCustActionVisible(actionId: string) {
        return !(actionId === 'deregister' && !self.tcConnected);
      },
      saveButtonText: self.tcConnected ? helptext.updateDialog.save_btn : helptext.updateDialog.connect_btn,
      parent: this,
      afterInit(entityDialog) {
        updateDialog = entityDialog;
        // load settings
        if (self.tcConnected) {
          Object.keys(self.tcStatus).forEach((key) => {
            const ctrl = entityDialog.formGroup.controls[key];
            if (ctrl) {
              ctrl.setValue(self.tcStatus[key]);
            }
          });
        }
      },
      customSubmit(entityDialog) {
        self.loader.open();
        self.ws.call(self.tc_updateCall, [entityDialog.formValue]).subscribe(
          (res) => {
            self.loader.close();
            entityDialog.dialogRef.close();
            // only show this for connecting TC
            if (!self.tcConnected) {
              self.dialogService.report(helptext.checkEmailInfoDialog.title, helptext.checkEmailInfoDialog.message);
            }
          },
          (err) => {
            self.loader.close();
            new EntityUtils().handleWSError(entityDialog.parent, err, entityDialog.parent.dialogService);
          },
        );
      },
    };
    this.dialogService.dialogForm(conf);
  }

  openStatusDialog() {
    const injectData = {
      parent: this,
      data: this.tcStatus,
    };
    if (this.isTcStatusOpened) {
      this.tcStatusDialogRef.close(true);
    } else {
      this.isTcStatusOpened = true;
      this.tcStatusDialogRef = this.dialog.open(TruecommandComponent, {
        disableClose: false,
        width: '400px',
        hasBackdrop: true,
        position: {
          top: '48px',
          right: '0px',
        },
        data: injectData,
      });
    }

    this.tcStatusDialogRef.afterClosed().subscribe(
      (res) => {
        this.isTcStatusOpened = false;
      },
    );
  }

  stopTCConnecting() {
    this.dialogService.generalDialog({
      title: helptext.stopTCConnectingDialog.title,
      icon: helptext.stopTCConnectingDialog.icon,
      message: helptext.stopTCConnectingDialog.message,
      confirmBtnMsg: helptext.stopTCConnectingDialog.confirmBtnMsg,
    }).subscribe((res) => {
      if (res) {
        this.loader.open();
        this.ws.call(this.tc_updateCall, [{ enabled: false }]).subscribe(
          (wsRes) => {
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
}
