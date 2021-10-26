import {
  Component, OnInit, Input,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { LocaleService } from 'app/services/locale.service';
import { NotificationsService, NotificationAlert } from 'app/services/notifications.service';

@UntilDestroy()
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel: MatSidenav;

  notifications: NotificationAlert[] = [];
  dismissedNotifications: NotificationAlert[] = [];
  ngDateFormat = 'yyyy-MM-dd HH:mm:ss';

  constructor(
    private router: Router,
    private notificationsService: NotificationsService,
    protected localeService: LocaleService,
  ) {}

  ngOnInit(): void {
    this.initData();
    this.notificationsService.getNotifications().pipe(untilDestroyed(this)).subscribe((notifications) => {
      this.notifications = [];
      this.dismissedNotifications = [];

      setTimeout(() => {
        this.ngDateFormat = `${this.localeService.getAngularFormat()}`;
        notifications.forEach((notification: NotificationAlert) => {
          if (!notification.dismissed) {
            if (!_.find(this.notifications, { id: notification.id })) {
              this.notifications.push(notification);
            }
          } else if (!_.find(this.dismissedNotifications, { id: notification.id })) {
            this.dismissedNotifications.push(notification);
          }
        });
      }, -1);
    });
    this.localeService.dateTimeFormatChange$.pipe(untilDestroyed(this)).subscribe(() => {
      this.ngDateFormat = `${this.localeService.getAngularFormat()}`;
    });
  }

  initData(): void {
    this.notifications = [];
    this.dismissedNotifications = [];

    const notificationAlerts: NotificationAlert[] = this.notificationsService.getNotificationList();
    notificationAlerts.forEach((notification: NotificationAlert) => {
      if (!notification.dismissed) {
        this.notifications.push(notification);
      } else {
        this.dismissedNotifications.push(notification);
      }
    });
  }

  closeAll(e: MouseEvent): void {
    e.preventDefault();
    this.notificationsService.dismissNotifications(this.notifications);
  }

  reopenAll(e: MouseEvent): void {
    e.preventDefault();
    this.notificationsService.restoreNotifications(this.dismissedNotifications);
  }

  turnMeOff(notification: NotificationAlert, e: MouseEvent): void {
    e.preventDefault();
    this.notificationsService.dismissNotifications([notification]);
  }

  turnMeOn(notification: NotificationAlert, e: MouseEvent): void {
    e.preventDefault();
    this.notificationsService.restoreNotifications([notification]);
  }

  closeNotificationsPanel(): void {
    this.notificPanel.close();
  }

  navigateTo(link: string[]): void {
    this.notificPanel.close().then(() => {
      this.router.navigate(link);
    });
  }
}
