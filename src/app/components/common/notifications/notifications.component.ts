import {RestService} from '../../../services';
import {Component, OnInit, ViewChild, Input} from '@angular/core';
import {MdSidenav} from '@angular/material';
import {Router, NavigationEnd} from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationsService, NotificationAlert } from 'app/services/notifications.service';



@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel;

  notifications: Array<NotificationAlert> = [];
  dismissedNotifications: Array<NotificationAlert> = []
  
  showMe: Boolean = false;

  constructor(private notificationsService: NotificationsService, private router: Router) {}
  
  ngOnInit() {
    this.router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd) {
        this.notificPanel.close();
      }
    });

    this.notificationsService.getNotifications(true).subscribe((notifications)=>{
        notifications.forEach((notification: NotificationAlert)=>{
            if( notification.dismissed === false ) {
              this.notifications.push( notification );
            } else {
              this.dismissedNotifications.push( notification );
            }
        });
        this.showMe = true;
    });
  }


  closeAll(e) {
    e.preventDefault();

    this.notificationsService.clearNotifications(this.notifications, true);
    
    this.notifications.forEach((notification: NotificationAlert)=>{
      notification.dismissed = true;
      this.dismissedNotifications.push( notification );
    });

    this.notifications = [];
  }

  reopenAll(e) {
    e.preventDefault();

    this.notificationsService.clearNotifications(this.dismissedNotifications, false);
    
    this.dismissedNotifications.forEach((notification: NotificationAlert)=>{
      notification.dismissed = false;
      this.notifications.push( notification );
    });

    this.dismissedNotifications = [];
  }
}
