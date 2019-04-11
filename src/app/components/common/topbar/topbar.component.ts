
import {interval as observableInterval,  Observable ,  Subscription } from 'rxjs';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as domHelper from '../../../helpers/dom.helper';
import { ThemeService, Theme } from '../../../services/theme/theme.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { AboutModalDialog } from '../dialog/about/about-dialog.component';
import { TaskManagerComponent } from '../dialog/task-manager/task-manager.component';
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import * as hopscotch from 'hopscotch';
import { RestService } from "../../../services/rest.service";
import { LanguageService } from "../../../services/language.service"
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../pages/common/entity/utils';
import { T } from '../../../translate-marker';

@Component({
  selector: 'topbar',
//  styleUrls: ['./topbar.component.css', '../../../../../node_modules/flag-icon-css/css/flag-icon.css'],
styleUrls: ['./topbar.component.css'],
templateUrl: './topbar.template.html'
})
export class TopbarComponent implements OnInit, OnDestroy {

  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];
  @Output() onLangChange = new EventEmitter<any>();

  interval: any;

  continuosStreaming: Subscription;
  showReplication = false;
  showResilvering = false;
  pendingNetworkChanges = false;
  replicationDetails;
  resilveringDetails;
  themesMenu: Theme[] = this.themeService.themesMenu;
  currentTheme:string = "ix-blue";
  public createThemeLabel = "Create Theme";
  isTaskMangerOpened = false;
  taskDialogRef: MatDialogRef<TaskManagerComponent>;

  constructor(
    public themeService: ThemeService,
    public core: CoreService,
    private router: Router,
    private notificationsService: NotificationsService,
    private activeRoute: ActivatedRoute,
    private ws: WebSocketService,
    private rest: RestService,
    public language: LanguageService,
    private dialogService: DialogService,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,

    public translate: TranslateService,
    protected loader: AppLoaderService, ) {}

  ngOnInit() {
    let theme = this.themeService.currentTheme();
    this.currentTheme = theme.name;
    this.core.register({observerClass:this,eventName:"ThemeListsChanged"}).subscribe((evt:CoreEvent) => {
      this.themesMenu = this.themeService.themesMenu
    });

    const notifications = this.notificationsService.getNotificationList();

    notifications.forEach((notificationAlert: NotificationAlert) => {
      if (notificationAlert.dismissed === false) {
        this.notifications.push(notificationAlert);
      }
    });
    this.notificationsService.getNotifications().subscribe((notifications1) => {
      this.notifications = [];
      notifications1.forEach((notificationAlert: NotificationAlert) => {
        if (notificationAlert.dismissed === false) {
          this.notifications.push(notificationAlert);
        }
      });
    });

    this.continuosStreaming = observableInterval(10000).subscribe(x => {
      this.showReplicationStatus();
      this.checkNetworkChangesPending();
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
  }

  ngOnDestroy() {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }

    this.continuosStreaming.unsubscribe();
  }

  setLang(lang) {
    this.language.currentLang = lang;
    this.onLangChange.emit(this.language.currentLang);
  }

  changeTheme(theme) {
    this.themeService.changeTheme(theme);
  }

  createTheme(){
    this.router.navigate(['/ui-preferences']);
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

  checkNetworkChangesPending() {
    this.ws.call('interface.has_pending_changes').subscribe(res => {
      this.pendingNetworkChanges = res;
    });
  }

  showNetworkChangesPending() {
    this.dialogService.confirm(
      T("Pending Network Changes"),
      T("You currently have uncommited network interface changes pending, go to the network interfaces section and review now?"),
      true, T('Continue')).subscribe(res => {
        if (res) {
          this.router.navigate(['/network/interfaces']);
        }
      });
  }

  showReplicationStatus() {
    this.rest.get('storage/replication/', {}).subscribe(res => {
      let idx = res.data.forEach(x => {
        if(typeof(x.repl_status) !== "undefined" &&
            x.repl_status != null && x.repl_status.indexOf('Sending') > -1 && x.repl_enabled == true) {
          this.showReplication = true;
          this.replicationDetails = x;
        }
      });
    }, err => {
      console.log(err);
    })
  }

  showReplicationDetails(){
    this.translate.get('Ok').subscribe((ok: string) => {
      this.snackBar.open(this.replicationDetails.repl_status.toString(), ok);
    });
  }

  showResilveringDetails() {
    this.translate.get('Ok').subscribe((ok: string) => {
      this.snackBar.open(`Resilvering ${this.resilveringDetails.name} - ${Math.ceil(this.resilveringDetails.scan.percentage)}%`, ok);
    });
  }

  onGoToLegacy() {
    this.dialogService.confirm(T("Switch to Legacy User Interface?"), T(""), true, T("Continue")).subscribe((res) => {
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
        width: '400px',
        hasBackdrop: false,
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
}
