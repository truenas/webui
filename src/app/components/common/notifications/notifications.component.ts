import {
  Component, OnInit, Input, OnDestroy,
} from '@angular/core';
import { WebSocketService } from 'app/services';
import { NotificationsService, NotificationAlert } from 'app/services/notifications.service';
import { LocaleService } from 'app/services/locale.service';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit, OnDestroy {
  @Input() notificPanel;

  notifications: NotificationAlert[] = [];
  dismissedNotifications: NotificationAlert[] = [];
  ngDateFormat = 'yyyy-MM-dd HH:mm:ss';
  dateFormatSubscription: Subscription;

  isHa = false;

  constructor(
    private notificationsService: NotificationsService,
    protected localeService: LocaleService,
    private ws: WebSocketService,
  ) {}

  ngOnInit() {
    this.initData();
    this.notificationsService.getNotifications().subscribe((notifications) => {
      this.notifications = [];
      this.dismissedNotifications = [];

      setTimeout(() => {
        this.ngDateFormat = `${this.localeService.getAngularFormat()}`;
        notifications.forEach((notification: NotificationAlert) => {
          if (notification.dismissed === false) {
            if (!_.find(this.notifications, { id: notification.id })) {
              this.notifications.push(notification);
            }
          } else if (!_.find(this.dismissedNotifications, { id: notification.id })) {
            this.dismissedNotifications.push(notification);
          }
        });
      }, -1);
    });
    this.dateFormatSubscription = this.localeService.dateTimeFormatChange$.subscribe(() => {
      this.ngDateFormat = `${this.localeService.getAngularFormat()}`;
    });

    this.checkFailoverStatus();
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
    this.notificationsService.dismissNotifications(this.notifications);
  }

  reopenAll(e) {
    e.preventDefault();
    this.notificationsService.restoreNotifications(this.dismissedNotifications);
  }

  turnMeOff(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.dismissNotifications([notification]);
  }

  turnMeOn(notification: NotificationAlert, e) {
    e.preventDefault();
    this.notificationsService.restoreNotifications([notification]);
  }

  ngOnDestroy() {
    this.dateFormatSubscription.unsubscribe();
  }

  private checkFailoverStatus(): void {
    if (window.localStorage.getItem('product_type') !== 'ENTERPRISE') {
      return;
    }

    this.ws.call('failover.licensed').subscribe((licensed: boolean) => {
      this.isHa = true;
    });
  }
}
