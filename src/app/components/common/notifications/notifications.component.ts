import { RestService } from '../../../services';
import { Component, OnInit, ViewChild, Input, AfterViewInit } from '@angular/core';
import { MdSidenav } from '@angular/material';
import { Router, NavigationEnd } from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationsService, NotificationAlert } from 'app/services/notifications.service';



@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements AfterViewInit {
  @Input() notificPanel;

  notifications: Array<NotificationAlert> = [];
  dismissedNotifications: Array<NotificationAlert> = []

  constructor(private notificationsService: NotificationsService, private router: Router) { }

  ngAfterViewInit() {
    this.router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd) {
        this.notificPanel.close();
      }
    });

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

    this.notifications.forEach((notification: NotificationAlert) => {
      notification.dismissed = true;
      this.dismissedNotifications.push(notification);
    });

    this.notifications = [];
  }

  reopenAll(e) {
    e.preventDefault();

    this.notificationsService.clearNotifications(this.dismissedNotifications, false);

    this.dismissedNotifications.forEach((notification: NotificationAlert) => {
      notification.dismissed = false;
      this.notifications.push(notification);
    });

    this.dismissedNotifications = [];
  }

  turnMeOff(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.clearNotifications([notification], true);

    for (let i = this.notifications.length - 1; i >= 0; i--) {
      if (this.notifications[i].id === notification.id) {
        this.notifications.splice(i, 1);
        break;
      }
    }

    notification.dismissed = true;
    this.dismissedNotifications.push(notification);
  }

  turnMeOn(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.clearNotifications([notification], false);

    for (let i = this.dismissedNotifications.length - 1; i >= 0; i--) {
      if (this.dismissedNotifications[i].id === notification.id) {
        this.dismissedNotifications.splice(i, 1);
        break;
      }
    }

    notification.dismissed = false;
    this.notifications.push(notification);
  }
}
