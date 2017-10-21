import { Component, OnInit, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as domHelper from '../../../helpers/dom.helper';
import { ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
import { AboutModalDialog } from '../about/about-dialog.component';
import { TourService } from '../../../services/tour.service';
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { MdSnackBar, MdDialog, MdDialogRef } from '@angular/material';
import * as hopscotch from 'hopscotch';

@Component({
  selector: 'topbar',
  templateUrl: './topbar.template.html'
})
export class TopbarComponent implements OnInit, OnDestroy {
  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];

  @Output() onLangChange = new EventEmitter<any>();

  interval: any;

  currentLang = 'en';
  availableLangs = [{
    name: 'English',
    code: 'en',
  }, {
    name: 'Spanish',
    code: 'es',
  }, {
    name: '中文',
    code: 'zh',
  }]
  freenasThemes;

  constructor(
    private themeService: ThemeService,
    private router: Router,
    private notificationsService: NotificationsService,
    private activeRoute: ActivatedRoute,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private tour: TourService,
    public dialog: MdDialog,
    public snackBar: MdSnackBar, ) { }

  ngOnInit() {
    this.freenasThemes = this.themeService.freenasThemes;

    const showTour = localStorage.getItem(this.router.url) || 'true';
    if (showTour === "true") {
      hopscotch.startTour(this.tour.startTour(this.router.url));
      localStorage.setItem(this.router.url, 'false');
    }

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
  }

  ngOnDestroy() {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }
  }

  startTour() {
    hopscotch.startTour(this.tour.startTour(this.router.url));
    localStorage.setItem(this.router.url, 'false');
  }

  setLang() {
    this.onLangChange.emit(this.currentLang);
  }

  changeTheme(theme) {
    this.themeService.changeTheme(theme);
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
  }

  onShowAbout() {
    let dialogRef = this.dialog.open(AboutModalDialog, {});

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  signOut() {
    this.dialogService.confirm("Logout", "You are about to LOGOUT of the FreeNAS WebUI. If unsure, hit 'Cancel', otherwise, press 'OK' to logout.").subscribe((res) => {
      if (res) {
        this.ws.logout();
      }
    });
  }

  onShutdown() {
    this.dialogService.confirm("Shutdown", "You are about to SHUTDOWN the FreeNAS system. If unsure, hit 'Cancel', otherwise, press 'OK' to shutdown the system.").subscribe((res) => {
      if (res) {
        this.ws.call('system.shutdown', {});
      }
    });
  }

  onReboot() {
    this.dialogService.confirm("Reboot", "You are about to REBOOT the FreeNAS system. If unsure, hit 'Cancel', otherwise, press 'OK' to reboot the system.").subscribe((res) => {
      if (res) {
        this.ws.call('system.reboot', {});
      }
    });
  }
}
