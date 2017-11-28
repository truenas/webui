import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as domHelper from '../../../helpers/dom.helper';
import { ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
import { AboutModalDialog } from '../dialog/about/about-dialog.component';
import { TourService } from '../../../services/tour.service';
import { NotificationAlert, NotificationsService } from '../../../services/notifications.service';
import { MdSnackBar, MdDialog, MdDialogRef } from '@angular/material';
import { Idle, DEFAULT_INTERRUPTSOURCES } from '@ng-idle/core';
import * as hopscotch from 'hopscotch';
import {RestService} from "../../../services/rest.service";
import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

@Component({
  selector: 'topbar',
  styleUrls: ['./topbar.component.css', '../../../../../node_modules/flag-icon-css/css/flag-icon.css'],
  templateUrl: './topbar.template.html'
})
export class TopbarComponent implements OnInit, OnDestroy {

  @Input() sidenav;
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];

  @Output() onLangChangeEmitter = new EventEmitter<any>();

  interval: any;

  currentLang = 'en';
  availableLangs = [{
    name: 'English',
    code: 'en',
  }, {
    name: 'Español',
    code: 'es',
  }, {
    name: '中文',
    code: 'zh',
  }]
  continuosStreaming: Subscription;
  showReplication: boolean = false;
  replicationDetails;

  constructor(
    public themeService: ThemeService,
    private router: Router,
    private notificationsService: NotificationsService,
    private activeRoute: ActivatedRoute,
    private ws: WebSocketService,
    private rest: RestService,
    private dialogService: DialogService,
    private tour: TourService,
    public dialog: MdDialog,
    public snackBar: MdSnackBar,
    private idle: Idle ) {

    idle.setIdle(10); // 10 seconds for delaying
    idle.setTimeout(900); // 15 minutes for waiting of activity
    idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);

    idle.onTimeoutWarning.subscribe((countdown:number) => {
      // Countdown - console.log('TimeoutWarning: ' + countdown);
    });
    idle.onTimeout.subscribe(() => {
      this.ws.logout();
    });
    idle.watch();
  }

  ngOnInit() {
    
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

    this.continuosStreaming = Observable.interval(10000).subscribe(x => {
      this.showReplicationStatus();
    });
  }

  ngOnDestroy() {
    if (typeof (this.interval) !== 'undefined') {
      clearInterval(this.interval);
    }

    this.continuosStreaming.unsubscribe();
  }

  startTour() {
    hopscotch.startTour(this.tour.startTour(this.router.url));
    localStorage.setItem(this.router.url, 'true');
  }

  setLang(lang) {
    this.currentLang = lang;
    this.onLangChangeEmitter.emit(this.currentLang);
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
      // The dialog was closed
    });
  }

  signOut() {
    this.idle.ngOnDestroy();
    this.dialogService.confirm("Log Out", "Log out of the WebUI?").subscribe((res) => {
      if (res) {
        this.ws.logout();
      }
    });
  }

  onShutdown() {
    this.dialogService.confirm("Shut Down", "Shut down the system?").subscribe((res) => {
      if (res) {
        this.ws.call('system.shutdown', {}).subscribe(res => {});
      }
    });
  }

  onReboot() {
    this.dialogService.confirm("Reboot", "Reboot the system?").subscribe((res) => {
      if (res) {
        this.ws.call('system.reboot', {}).subscribe(res => {});
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
    this.snackBar.open(this.replicationDetails.repl_status.toString(), 'OKAY');
  }
}
