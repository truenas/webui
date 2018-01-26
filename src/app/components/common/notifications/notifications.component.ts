import { RestService } from '../../../services';
import { Component, OnInit, ViewChild, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { MatSidenav } from '@angular/material';
import { Router, NavigationEnd } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationsService, NotificationAlert } from 'app/services/notifications.service';



@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  
  @Input() notificPanel;

  notifications: Array<NotificationAlert> = [];
  dismissedNotifications: Array<NotificationAlert> = []

  constructor(private notificationsService: NotificationsService, private router: Router) { 
  }

  ngOnDestroy(): void {
    
  }
 

  ngOnInit() {
    this.initData();
    
    this.notificationsService.getNotifications().subscribe((notifications)=>{
      this.notifications = [];
      this.dismissedNotifications = [];
      
      setTimeout(()=>{
        notifications.forEach((notification: NotificationAlert) => {
          if (notification.dismissed === false) {
            this.notifications.push(notification);
          } else {
            this.dismissedNotifications.push(notification);
          }
        });
    
      }, -1);
    });
  }

  initData() {
    this.notifications = [];
    this.dismissedNotifications = [];

    const notificationAlerts: NotificationAlert[] = this.notificationsService.getNotificationList();
    notificationAlerts.forEach((notification: NotificationAlert) => {
      if (notification.dismissed === false) {
        this.notifications.push(notification);
      } else {
        this.dismissedNotifications.push(notification);
      }
    });
  }

  closeAll(e) {
    e.preventDefault();
    this.notificationsService.clearNotifications(this.notifications, true);
  }

  reopenAll(e) {
    e.preventDefault();
    this.notificationsService.clearNotifications(this.dismissedNotifications, false);
  }

  turnMeOff(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.clearNotifications([notification], true);
  }

  turnMeOn(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.clearNotifications([notification], false);
  }
}
