import {RestService} from '../../../services';
import {Component, OnInit, ViewChild, Input} from '@angular/core';
import {MdSidenav} from '@angular/material';
import {Router, NavigationEnd} from '@angular/router';
import { TopbarComponent } from '../topbar/topbar.component';
import { NotificationsService } from 'app/services/notifications.service';



@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel;

  notifications: Array<Notification> = [];
  
 
  constructor(private notificationsService: NotificationsService, private router: Router) {}
  
  ngOnInit() {
    this.router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd) {
        this.notificPanel.close();
      }
    });

    this.notificationsService.getNotifications().subscribe((notifications)=>{
        this.notifications = notifications;
    });
  }


  clearAll(e) {
    e.preventDefault();

    this.notificationsService.clearNotifications();
    this.notifications = [];
  }
}
