import { Injectable, OnInit } from '@angular/core';
import { RestService, WebSocketService } from 'app/services';
import { Observable ,  Observer ,  Subject } from 'rxjs';

export interface NotificationAlert {
  id: string;
  message: string;
  icon: string;
  icon_tooltip: string;
  time: string;
  time_locale: string;
  timezone: string;
  route: string;
  color: string;
  level: string;
  dismissed: boolean;
}


@Injectable()
export class NotificationsService {

  private subject = new Subject<any>();
  private intervalPeriod = 20000;
  private interval;
  private notifications: NotificationAlert[] = [];
  private running = false;
  private locale = 'en-US';
  private timeZone = 'UTC'

  constructor(private restService: RestService, private ws: WebSocketService) {

    this.initMe();

  }

  initMe(): void {

    this.ws.call('system.general.config', []).subscribe((res) => {
      if (res.timezone !== 'WET' && res.timezone !== 'posixrules') {
        this.timeZone = res.timezone;
      }
      
      this.ws.call('alert.list', []).subscribe((res) => {
        this.notifications = this.alertsArrivedHandler(res);
        this.subject.next(this.notifications);
    });

    this.interval = setInterval(() => {
        
        if (this.running === false) {
          this.running = true;

          this.ws.call('alert.list', []).subscribe((res) => {
            this.notifications = this.alertsArrivedHandler(res);
            this.subject.next(this.notifications);
            this.running = false;
          });
        } else {
          this.subject.next(this.notifications);
        }
      }, this.intervalPeriod);
      
    });

  }

  public getNotifications(): Observable<any> {
    return this.subject.asObservable();
  }

  public getNotificationList(): NotificationAlert[] {
    return this.notifications;
  }

  public dismissNotifications(notifications: Array<NotificationAlert>) {
    const notificationMap = new Map<string,NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.dismiss', [notification.id]).subscribe((res) => {
        console.log("alert dismissed id:" + notification.id);
      });
    });

    this.notifications.forEach((notification)=>{
      if( notificationMap.has(notification.id) === true ) {
        notification.dismissed = true;
      }
    });

    this.subject.next(this.notifications);
  }

  public restoreNotifications(notifications: Array<NotificationAlert>) {
    const notificationMap = new Map<string,NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.restore', [notification.id]).subscribe((res) => {
        console.log("alert restore id:" + notification.id);
      });
    });

    this.notifications.forEach((notification)=>{
      if( notificationMap.has(notification.id) === true ) {
        notification.dismissed = false;
      }
    });

    this.subject.next(this.notifications);
  }

  // response array from 'alert.lst'
  //   {
  //     args:"tank"
  //     datetime:{$date: 1525108866081}
  //     dismissed:false
  //     formatted:"New feature flags are available for volume tank. Refer to the "Upgrading a ZFS Pool" section of the User Guide for instructions."
  //     id:"A;VolumeVersion;["New feature flags are available for volume %s. Refer to the \"Upgrading a ZFS Pool\" section of the User Guide for instructions.", "tank"]"
  //     key:"["New feature flags are available for volume %s. Refer to the \"Upgrading a ZFS Pool\" section of the User Guide for instructions.", "tank"]"
  //     level:"WARNING"
  //     mail:null
  //     node:"A"
  //     source:"VolumeVersion"
  //     title:"New feature flags are available for volume %s. Refer to the "Upgrading a ZFS Pool" section of the User Guide for instructions."
  //   }
  private alertsArrivedHandler(res): NotificationAlert[] {
    const returnAlerts = new Array<NotificationAlert>();
    const data: Array<any> = res;

    if (data && data.length > 0) {
      data.forEach((alertObj: NotificationAlert) => {

        returnAlerts.push(this.addNotification(alertObj));

      });
    }

    return returnAlerts;
  }

  private addNotification(alertObj): NotificationAlert {
    const id: string = alertObj.id;
    const dismissed: boolean = alertObj.dismissed;
    const message: string = <string>alertObj.formatted;
    const level: string = <string>alertObj.level;
    const date: Date = new Date(alertObj.datetime.$date);
    const dateStr = date.toUTCString();
    const dateStrLocale = date.toLocaleString(this.locale, {timeZone: this.timeZone});
    const one_shot: boolean = alertObj.one_shot;
    let icon_tooltip: string = <string>alertObj.level;
    //const dateStr = date.toDateString() + " " + this.getTimeAsString(date.getTime());
    const routeName = "/dashboard"
    let icon = "info";
    let color = "primary";

    if (level === "WARNING") {
      icon = "warning";
      color = "accent";
    } else if (level === 'ERROR') {
      icon = "error";
      color = "warn";
    } else if (level === 'CRITICAL') {
      icon = "error";
      color = "warn";
    }

    if (one_shot) {
      icon = "notifications_active";
      icon_tooltip = "This is a ONE-SHOT " + level + " alert, it won't be dismissed automatically";
    }

    const newNotification: NotificationAlert = {
      id: id,
      message: message,
      icon: icon,
      icon_tooltip: icon_tooltip,
      time: dateStr,
      time_locale: dateStrLocale,
      timezone: this.timeZone,
      route: routeName,
      color: color,
      level: level,
      dismissed: dismissed
    };

    return newNotification;
  }

}
