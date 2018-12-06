import { Injectable, OnInit } from '@angular/core';
import { RestService, WebSocketService } from 'app/services';
import { Observable ,  Observer ,  Subject } from 'rxjs';

export interface NotificationAlert {
  id: string;
  message: string;
  icon: string;
  time: string;
  route: string;
  color: string;
  dismissed: boolean;
}


@Injectable()
export class NotificationsService {

  private subject = new Subject<any>();
  private intervalPeriod = 20000;
  private interval;
  private notifications: NotificationAlert[] = [];
  private running = false;

  constructor(private restService: RestService, private ws: WebSocketService) {

    this.initMe();

  }

  initMe(): void {

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
    //const dateStr = date.toDateString() + " " + this.getTimeAsString(date.getTime());
    const routeName = "/dashboard"
    let icon = "info";
    let color = "primary";

    if (level === "WARNING") {
      icon = "watch_later";
      color = "warn";
    } else if (level === 'ERROR') {
      icon = "error";
      color = "warn";
    }

    const newNotification: NotificationAlert = {
      id: id,
      message: message,
      icon: icon,
      time: dateStr,
      route: routeName,
      color: color,
      dismissed: dismissed
    };

    return newNotification;
  }

}
