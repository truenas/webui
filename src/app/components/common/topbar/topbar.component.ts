import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { CoreEvent } from 'app/core/services/core.service';
import { Subscription, interval } from 'rxjs';
import * as domHelper from '../../../helpers/dom.helper';
import network_interfaces_helptext from '../../../helptext/network/interfaces/interfaces-list';
import helptext from '../../../helptext/topbar';
import { EntityJobComponent } from '../../../pages/common/entity/entity-job/entity-job.component';
import { EntityUtils } from '../../../pages/common/entity/utils';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import { LanguageService } from "../../../services/language.service";
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { RestService } from "../../../services/rest.service";
import { SystemGeneralService } from '../../../services/system-general.service';
import { Theme, ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { T } from '../../../translate-marker';
import { AboutModalDialog } from '../dialog/about/about-dialog.component';
import { DirectoryServicesMonitorComponent } from '../dialog/directory-services-monitor/directory-services-monitor.component';
import { TaskManagerComponent } from '../dialog/task-manager/task-manager.component';

@Component({
  selector: 'topbar',
  styleUrls: ['./topbar.component.css'],
  templateUrl: './topbar.template.html'
})
export class TopbarComponent extends ViewControllerComponent implements OnInit, OnDestroy {

  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];
  @Output() onLangChange = new EventEmitter<any>();

  interval: any;

  replicationStatusSub: Subscription;
  continuousStreaming: Subscription
  showReplication = false;
  showResilvering = false;
  pendingNetworkChanges = false;
  waitingNetworkCheckin = false;
  replicationDetails;
  resilveringDetails;
  themesMenu: Theme[] = this.themeService.themesMenu;
  currentTheme:string = "ix-blue";
  public createThemeLabel = "Create Theme";
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
  sysName: string = 'FreeNAS';
  hostname: string;
  public updateIsRunning = false;
  public updateNotificationSent = false;
  private user_check_in_prompted = false;
  public mat_tooltips = helptext.mat_tooltips;

  protected dialogRef: any;

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
    protected loader: AppLoaderService, ) {
      super();
      this.sysGenService.updateRunningNoticeSent.subscribe(() => {
        this.updateNotificationSent = true;
        setTimeout(() => {
          this.updateNotificationSent = false;
        }, 900000);
      });
    }

  ngOnInit() {
    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.checkEULA();
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        this.is_ha = is_ha;
        this.is_ha ? window.localStorage.setItem('alias_ips', 'show') : window.localStorage.setItem('alias_ips', '0');
        this.getHAStatus();
      });
      this.sysName = 'TrueNAS';
    } else {
      window.localStorage.setItem('alias_ips', '0');
      this.checkLegacyUISetting();
    }
    this.ws.subscribe('core.get_jobs').subscribe((res) => {
      if (res && res.fields.method === 'update.update' || res.fields.method === 'failover.upgrade') {
        this.updateIsRunning = true;
        if (!this.updateNotificationSent) {
          this.updateInProgress();
          this.updateNotificationSent = true;
        }      
      }
    })
    let theme = this.themeService.currentTheme();
    this.currentTheme = theme.name;
    this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
      this.themesMenu = this.themeService.themesMenu
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
    this.core.register({observerClass: this, eventName:"NetworkInterfacesChanged"}).subscribe((evt:CoreEvent) => {
      if (evt && evt.data.commit) {
        this.pendingNetworkChanges = false;
        this.checkNetworkCheckinWaiting();
      } else {
        this.checkNetworkChangesPending();
      }
    });

    this.replicationStatusSub = this.ws
      .sub("replication.query")
      .subscribe(repStatus => {
        repStatus.data.forEach(x => {
          if (
            typeof x.repl_status === "string" &&
            x.repl_status.indexOf("Sending") > -1 &&
            x.repl_enabled
          ) {
            this.showReplication = true;
            this.replicationDetails = x;
          }
        });
      });

    this.continuousStreaming = interval(10000).subscribe(x => {
      if (this.is_ha) {
        this.getHAStatus();
      }
    });

    this.ws.subscribe('zfs.pool.scan').subscribe(res => {
      if(res && res.fields.scan.function.indexOf('RESILVER') > -1 ) {
        this.resilveringDetails = res.fields;
        this.showResilvering = true;
      }
    });

    setInterval(() => {
      if(this.resilveringDetails && this.resilveringDetails.scan.state == 'FINISHED') {
        this.showResilvering = false;
        this.resilveringDetails = '';
      }
    }, 2500);

    this.core.register({
     observerClass: this,
     eventName: "SysInfo"
    }).subscribe((evt: CoreEvent) => {
      this.hostname = evt.data.hostname;
    });
 
    this.core.emit({name: "SysInfoRequest", sender:this});
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

    this.continuousStreaming.unsubscribe();
    this.replicationStatusSub.unsubscribe();

    this.core.unregister({observerClass:this});
  }

  setLang(lang) {
    this.language.currentLang = lang;
    this.onLangChange.emit(this.language.currentLang);
  }

  toggleNotific() {
    this.notificPanel.toggle();
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  toggleCollapse() {
    let appBody = document.body;

    domHelper.toggleClass(appBody, 'collapsed-menu');
    domHelper.removeClass(document.getElementsByClassName('has-submenu'), 'open');

    // Fix for sidebar
    if(!domHelper.hasClass(appBody, 'collapsed-menu')) {
      (<HTMLElement>document.querySelector('mat-sidenav-content')).style.marginLeft = '240px';
    }
  }

  onShowAbout() {
    let dialogRef = this.dialog.open(AboutModalDialog, {});

    dialogRef.afterClosed().subscribe(result => {
      // The dialog was closed
    });
  }

  signOut() {
    this.ws.logout();
  }

  onShutdown() {
    this.translate.get('Shut down').subscribe((shutdown: string) => {
      this.translate.get('Shut down the system?').subscribe((shutdown_prompt: string) => {
        this.dialogService.confirm(shutdown, shutdown_prompt, false, T('Shut Down')).subscribe((res) => {
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
    this.ws.call('truenas.is_eula_accepted').subscribe(eula_accepted => {
      if (!eula_accepted) {
        this.ws.call('truenas.get_eula').subscribe(eula => {
          this.dialogService.confirm(T("End User License Agreement - TrueNAS"), eula, true, T("I Agree"), false, null, '', null, null, true).subscribe(accept_eula => {
            if (accept_eula) {
              this.ws.call('truenas.accept_eula')
                .subscribe(),
                err => { console.error(err)};
            }
          });
        });
      }
    });
  }

  checkNetworkChangesPending() {
    this.ws.call('interface.has_pending_changes').subscribe(res => {
      this.pendingNetworkChanges = res;
    });
  }

  checkNetworkCheckinWaiting() {
    this.ws.call('interface.checkin_waiting').subscribe(res => {
      if (res != null) {
        this.waitingNetworkCheckin = true;
        if (!this.user_check_in_prompted) {
          this.user_check_in_prompted = true;
          this.showNetworkCheckinWaiting();
        }
      } else {
        this.waitingNetworkCheckin = false;
      }
    });
  }

  showNetworkCheckinWaiting() {
    this.dialogService.confirm(
      network_interfaces_helptext.checkin_title,
      network_interfaces_helptext.pending_checkin_dialog_text,
      true, network_interfaces_helptext.checkin_button).subscribe(res => {
        if (res) {
          this.user_check_in_prompted = false;
          this.loader.open();
          this.ws.call('interface.checkin').subscribe((success) => {
            this.core.emit({name: "NetworkInterfacesChanged", data: {commit:true, checkin:true}, sender:this});
            this.loader.close();
            this.dialogService.Info(
              network_interfaces_helptext.checkin_complete_title,
              network_interfaces_helptext.checkin_complete_message);
            this.waitingNetworkCheckin = false;
          }, (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(null, err, this.dialogService);
          });
        }
      }
    );
  }

  showNetworkChangesPending() {
    if (this.waitingNetworkCheckin) {
      this.showNetworkCheckinWaiting();
    } else {
      this.dialogService.confirm(
        network_interfaces_helptext.pending_changes_title,
        network_interfaces_helptext.pending_changes_message,
        true, T('Continue')).subscribe(res => {
          if (res) {
            this.router.navigate(['/network/interfaces']);
          }
      });
    }
  }

  showReplicationDetails(){
    this.dialogService.Info(T('Replication Status',), this.replicationDetails.repl_status.toString());
  }

  showResilveringDetails() {
    this.dialogService.Info(T('Resilvering Status'), 
      `Resilvering ${this.resilveringDetails.name} - ${Math.ceil(this.resilveringDetails.scan.percentage)}%`);
  }

  onGoToLegacy() {
    this.dialogService.confirm(T("Warning"),
      helptext.legacyUIWarning, 
      true, T("Continue to Legacy UI")).subscribe((res) => {
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
          right: '0px'
        },
      });
    }

    this.taskDialogRef.afterClosed().subscribe(
      (res) => {
        this.isTaskMangerOpened = false;
      }
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
          right: '0px'
        },
      });
    }

    this.dirServicesMonitor.afterClosed().subscribe(
      (res) => {
        this.isDirServicesMonitorOpened = false;
      }
    );
  }

  getHAStatus() {
    this.ws.call('failover.disabled_reasons').subscribe(res => {
      this.ha_disabled_reasons = res;
      if (res.length > 0) {
        this.ha_status_text = helptext.ha_status_text_disabled;
      } else {
        this.ha_status_text = helptext.ha_status_text_enabled;
        if (!this.pendingUpgradeChecked) {
          this.checkUpgradePending();
        }
      }
    });
  }

  showHAStatus() {
    let reasons = '<ul>\n';
    let ha_icon = "info";
    let ha_status = "";
    if (this.ha_disabled_reasons.length > 0) {
      ha_status = helptext.ha_status_text_disabled;
      ha_icon = "warning";
      for (let i = 0; i < this.ha_disabled_reasons.length; i++) {
        const reason_text = helptext.ha_disabled_reasons[this.ha_disabled_reasons[i]];
        this.translate.get(reason_text).subscribe(reason => {
          reasons = reasons + '<li>' + reason_text + '</li>\n';
        });
      }
    } else {
      ha_status = helptext.ha_status_text_enabled;
      this.translate.get(helptext.ha_is_enabled).subscribe(ha_is_enabled => {
        reasons = reasons + '<li>' + ha_is_enabled + '</li>\n';
      });
    }
    reasons = reasons + '</ul>';

    this.dialogService.Info(ha_status, reasons, '500px', ha_icon, true);
  }

  checkUpgradePending() {
    this.ws.call('failover.upgrade_pending').subscribe((res) => {
     this.pendingUpgradeChecked = true;
      this.upgradeWaitingToFinish = res;
      if(res) {
        this.upgradePendingDialog();
      };
    });
  }

  upgradePendingDialog() {
    this.dialogService.confirm(
      T("Pending Upgrade"),
      T("There is an upgrade waiting to finish."),
      true, T('Continue')).subscribe(res => {
        if (res) {
          this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Update") }, disableClose: false });
          this.dialogRef.componentInstance.setCall('failover.upgrade_finish');
          this.dialogRef.componentInstance.disableProgressValue(true);
          this.dialogRef.componentInstance.submit();
          this.dialogRef.componentInstance.success.subscribe((success) => {
            this.dialogRef.close(false);
            console.info('success', success);
            this.upgradeWaitingToFinish = false
          });
          this.dialogRef.componentInstance.failure.subscribe((failure) => {
            this.dialogService.errorReport(failure.error, failure.reason, failure.trace.formatted);
          });
        }
      });
  }

  getDirServicesStatus() { 
    this.ws.call('directoryservices.get_state').subscribe((res) => {
      for (let i in res) {
        this.dirServicesStatus.push(res[i])
      }
      this.showDSIcon();
    })
    this.ws.subscribe('directoryservices.status').subscribe((res) => {
      this.dirServicesStatus = [];
      for (let i in res.fields) {
        this.dirServicesStatus.push(res.fields[i])
      }
      this.showDSIcon()
    })
  };

  showDSIcon() {
    this.showDirServicesIcon = false;
    this.dirServicesStatus.forEach((item) => {
      if (item !== 'DISABLED') { 
        this.showDirServicesIcon = true; 
      };
    });
  }

  updateInProgress() {
    this.sysGenService.updateRunning.emit('true');
    if (!this.updateNotificationSent) {
      this.showUpdateDialog();
      this.updateNotificationSent = true;
      setTimeout(() => {
        this.updateNotificationSent = false;
      }, 600000);
    }      
  };

  showUpdateDialog() {
    this.dialogService.confirm(helptext.updateRunning_dialog.title, 
      helptext.updateRunning_dialog.message,
      true, T('Close'), false, '', '', '', '', true);
  };
}
