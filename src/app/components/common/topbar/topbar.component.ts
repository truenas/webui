import { Component, OnInit, EventEmitter, Input, Output, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as domHelper from '../../../helpers/dom.helper';
import { ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';
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
  
  notifications: Notification[] = [];
  runningAlertCheck = false;

  @Output() onLangChange = new EventEmitter < any > ();

  notificationCount = 0;
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
    public snackBar: MdSnackBar,
    public dialog: MdDialog,) {}
  ngOnInit() {
    this.freenasThemes = this.themeService.freenasThemes;
  

    const showTour = localStorage.getItem(this.router.url) || 'true';
    if (showTour === "true") {
      hopscotch.startTour(this.tour.startTour(this.router.url));
      localStorage.setItem(this.router.url, 'false');
    }

    this.runningAlertCheck = true;

    this.notificationsService.getNotifications(false).subscribe((notifications1)=>{
      this.notifications = notifications1;
      this.runningAlertCheck = false;

      this.interval = setInterval(()=>{
        
        // Im doing this because found on a super slow network.. (mine)
        // if the alerts/ rest api is lagging.. These intervals still
        // stack rest calls up,  This way.. I wait for a return.. before
        // making another call. .Thus insuring.. Im not stacking requests
        // So now the logic is.. Make a check run... But only if one
        // is not in the process of already running.  In that case.. Wait
        // for it to complete.. And then.. re-do the apis once completed.
        if( this.runningAlertCheck === false  ) {
          
          this.runningAlertCheck = true;

          this.notificationsService.getNotifications(false).subscribe((notifications2)=>{
            this.notifications = notifications2;
            this.runningAlertCheck = false;
          });
        }
    
      }, 8000);
    });

    

  }

  ngOnDestroy() {
    if (typeof(this.interval) !== 'undefined') {
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
    let dialogRef = this.dialog.open(AboutModalDialog, {
      width: '250px'
    });

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

/*
* Angular Material Modal dialog
*/
@Component({
  selector: 'about-dialog',
  templateUrl: './about-dialog.html',
})
export class AboutModalDialog {

  constructor(
    public dialogRef: MdDialogRef<AboutModalDialog>,) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
