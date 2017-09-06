import {RestService} from '../../../services';
import {Component, OnInit, ViewChild, Input} from '@angular/core';
import {MdSidenav} from '@angular/material';
import {Router, NavigationEnd} from '@angular/router';


interface Notification {
  message: string;
  icon: string;
  time: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel;

  notifications: Array<Notification> = [];
  
 
  constructor(private _rs: RestService, private router: Router) {}
  
  ngOnInit() {
    this.router.events.subscribe((routeChange) => {
      if (routeChange instanceof NavigationEnd) {
        this.notificPanel.close();
      }
    });

    this._rs.get("system/alert", {}).subscribe((res) => {
      this.alertsArrivedHandler(res);
    });
  }

  /**
   * Returns the hours/mintues am/pm part of the date.
   */
  private getTimeAsString(timestamp: number) {
    const d: Date = new Date(timestamp);
    d.setHours(d.getHours() + 2); // offset from local time
    const h = (d.getHours() % 12) || 12; // show midnight & noon as 12
    return (
      (h < 10 ? '0' : '') + h +
      (d.getMinutes() < 10 ? ':0' : ':') + d.getMinutes() +
      // optional seconds display
      // ( d.getSeconds() < 10 ? ':0' : ':') + d.getSeconds() + 
      (d.getHours() < 12 ? ' AM' : ' PM')
    );

  }

  /**
   * Takes incomming JSON REST message from system/alert rest api
   * res.data  array where each element looks like:
   *  {"dismissed":false,
   *   "id":"d90e9594a20cba9660003a55c3f51a6c",
   *   "level":"WARN",
   *   "message":"smartd is not running.\n",
   *   "timestamp":1504725447}
   */
  alertsArrivedHandler(res) {
   const data: Array<any> = res.data;

    data.forEach((alertObj) => {
      this.addNotification(alertObj);
    });
  }


  addNotification(alertObj) {

    const message: string = <string>alertObj.message;
    const level: string = <string>alertObj.level;
    const timestamp: number = <number>alertObj.timestamp * 1000; // unix timestamp in seconds
                                                                 // javascript in milli
    const date: Date = new Date(timestamp);
    const dateStr = date.toDateString() + " " + this.getTimeAsString(date.getTime());
    const routeName = "/dashboard"
    let icon = "info";
    let color = "primary";

    if (level === "WARN") {
      icon = "watch_later";
      color = "warn";
    } else if (level === 'ERROR') {
      icon = "error";
      color = "warn";
    }

    const newNotification: Notification = {
      message: message,
      icon: icon,
      time: dateStr,
      route: routeName,
      color: color
    };

    this.notifications.push(newNotification);

  }

  clearAll(e) {
    e.preventDefault();
    this.notifications = [];
  }
}
