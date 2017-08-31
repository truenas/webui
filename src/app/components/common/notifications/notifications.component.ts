import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { MdSidenav } from '@angular/material';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {
  @Input() notificPanel;

  // Dummy notifications
  notifications = [{
    message: 'Replication Task "SYAB_hivemind-assimilation" finished successfully!',
    icon: 'check_circle',
    time: 'Just now',
    route: '/dashboard',
    color: 'primary'
  }, {
    message: 'Replication Task "SYAB_hivemind-assimilation" is running...',
    icon: 'swap_horiz',
    time: '9 minutes ago',
    route: '/dashboard',
    color: ''
  }, {
    message: 'Replication Task "SYAB_hivemind-assimilation" initialized.',
    icon: 'watch_later',
    time: '13 minutes ago',
    route: '/dashboard',
    color: ''
  }, {
    message: 'Snapshot Task "backsnap_datasets_20170901" has failed with error: not enough space left in pool.',
    icon: 'error',
    time: '36 minutes ago',
    route: '/dashboard',
    color: 'warn'
  }, {
    message: 'Available space in pool "tank" is critically LOW.',
    icon: 'info',
    time: '42 minutes ago',
    route: '/dashboard',
    color: 'accent'
  }, {
    message: 'Snapshot Task "backsnap_datasets_20170901" is running...',
    icon: 'photo_camera',
    time: 'An hour ago',
    route: '/dashboard',
    color: ''
  }, {
    message: 'Snapshot Task "backsnap_datasets_20170901" initialized.',
    icon: 'watch_later',
    time: 'An hour ago',
    route: '/dashboard',
    color: ''
  }, {
    message: 'FreeNAS host "lit.freenas.host" rebooted after updates. Uptime reset to 0.',
    icon: 'error',
    time: '3 days ago',
    route: '/chat',
    color: 'accent'
  }, {
    message: 'FreeNAS host "lit.freenas.host" finished updating on train: 11.1-NIGHTLIES',
    icon: 'info',
    time: '5 days ago',
    route: '/dashboard',
    color: 'primary'
  }]

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.subscribe((routeChange) => {
        if (routeChange instanceof NavigationEnd) {
          this.notificPanel.close();
        }
    });
  }
  clearAll(e) {
    e.preventDefault();
    this.notifications = [];
  }
}
