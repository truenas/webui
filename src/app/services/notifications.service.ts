import { Injectable } from '@angular/core';

import { Observable, Subject, Subscription } from 'rxjs';
import * as _ from 'lodash';

import { AlertLevel } from 'app/enums/alert-level.enum';
import { WebSocketService, SystemGeneralService } from 'app/services';

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
  level: AlertLevel;
  dismissed: boolean;
}

@Injectable()
export class NotificationsService {
  private subject = new Subject<any>();
  private notifications: NotificationAlert[] = [];
  private locale = 'en-US';
  private timeZone = 'UTC';
  private getGenConfig: Subscription;

  constructor(
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
  ) {
    this.initMe();
  }

  initMe(): void {
    this.getGenConfig = this.sysGeneralService.getGeneralConfig.subscribe((res) => {
      if (res.timezone !== 'WET' && res.timezone !== 'posixrules') {
        this.timeZone = res.timezone;
      }

      this.ws.call('alert.list', []).subscribe((res) => {
        this.notifications = this.alertsArrivedHandler(res);
        this.subject.next(this.notifications);
      });

      this.ws.sub('alert.list').subscribe((res) => {
        // check for updates to alerts
        const notification = this.alertsArrivedHandler([res])[0];
        if (!_.find(this.notifications, { id: notification.id })) {
          this.notifications.push(notification);
        }
        this.subject.next(this.notifications);
      });

      this.ws.subscribe('alert.list').subscribe((res) => {
        // check for changed alerts
        if (res && res.msg === 'changed' && res.cleared) {
          const index = _.findIndex(this.notifications, { id: res.id });
          if (index !== -1) {
            this.notifications.splice(index, 1);
          }
          this.subject.next(this.notifications);
        }
      });
    });
  }

  getNotifications(): Observable<any> {
    return this.subject.asObservable();
  }

  getNotificationList(): NotificationAlert[] {
    return this.notifications;
  }

  dismissNotifications(notifications: NotificationAlert[]) {
    const notificationMap = new Map<string, NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.dismiss', [notification.id]).subscribe(() => {
        console.log('alert dismissed id:' + notification.id);
      });
    });

    this.notifications.forEach((notification) => {
      if (notificationMap.has(notification.id) === true) {
        notification.dismissed = true;
      }
    });

    this.subject.next(this.notifications);
  }

  restoreNotifications(notifications: NotificationAlert[]) {
    const notificationMap = new Map<string, NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.restore', [notification.id]).subscribe((res) => {
        console.log('alert restore id:' + notification.id);
      });
    });

    this.notifications.forEach((notification) => {
      if (notificationMap.has(notification.id) === true) {
        notification.dismissed = false;
      }
    });

    this.subject.next(this.notifications);
  }

  private alertsArrivedHandler(res: any): NotificationAlert[] {
    const returnAlerts = new Array<NotificationAlert>();
    const data: any[] = res;

    if (data && data.length > 0) {
      data.forEach((alertObj: NotificationAlert) => {
        returnAlerts.push(this.addNotification(alertObj));
      });
    }

    return returnAlerts;
  }

  private addNotification(alertObj: any): NotificationAlert {
    const id: string = alertObj.id;
    const dismissed: boolean = alertObj.dismissed;
    const message: string = <string>alertObj.formatted;
    const level: AlertLevel = alertObj.level;
    const date: Date = new Date(alertObj.datetime.$date);
    const dateStr = date.toUTCString();
    const dateStrLocale = date.toLocaleString(this.locale, { timeZone: this.timeZone });
    const one_shot: boolean = alertObj.one_shot;
    let icon_tooltip: string = <string>alertObj.level;
    const routeName = '/dashboard';
    let icon = 'info';
    let color = 'primary';

    if (level === AlertLevel.Warning) {
      icon = 'warning';
      color = 'accent';
    } else if (level === AlertLevel.Error) {
      icon = 'error';
      color = 'warn';
    } else if (level === AlertLevel.Critical) {
      icon = 'error';
      color = 'warn';
    }

    if (one_shot) {
      icon = 'notifications_active';
      icon_tooltip = 'This is a ONE-SHOT ' + level + " alert, it won't be dismissed automatically";
    }

    const newNotification: NotificationAlert = {
      id,
      message,
      icon,
      icon_tooltip,
      time: dateStr,
      time_locale: dateStrLocale,
      timezone: this.timeZone,
      route: routeName,
      color,
      level,
      dismissed,
    };

    return newNotification;
  }

  ngOnDestroy() {
    this.getGenConfig.unsubscribe();
  }
}
