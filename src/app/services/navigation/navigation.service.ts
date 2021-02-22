import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { T } from '../../translate-marker';

import * as _ from 'lodash';

interface IMenuItem {
  type: string; // Possible values: link/slideOut/icon/separator/extLink
  name ? : string; // Used as display text for item and title for separator type
  state ? : string; // Router state
  icon ? : string; // Item icon name
  tooltip ? : string; // Tooltip text 
  disabled ? : boolean; // If true, item will not be appeared in sidenav.
  sub ? : IChildItem[] // Dropdown items
}
interface IChildItem {
  name: string; // Display text
  state: string; // Router state
  disabled ? : boolean; // If true, item will not be appeared in sidenav.
}

@Injectable()
export class NavigationService {
  // all menu for truenas enterprise features
  public enterpriseFeatures = [
    { menu: 'system', sub: 'kmip' }
  ];

  // all menu for iXsystems hardware features
  public hardwareFeatures = [
    { menu: 'system', sub: 'viewenclosure' }
  ];

  defaultMenu: IMenuItem[] = [{
      name: T('Dashboard'),
      type: 'link',
      tooltip: T('Dashboard'),
      icon: 'dashboard',
      state: 'dashboard',
    },
    {
      name: T('Storage'),
      type: 'link',
      tooltip: T('Storage'),
      icon: 'dns',
      state: 'storage',
    },
    {
      name: T('Shares'),
      type: 'slideOut',
      tooltip: T('Shares'),
      icon: 'folder_shared',
      state: 'sharing',
      sub: [
        { name: T('Apple Shares (AFP)'), state: 'afp' },
        { name: T('Block Shares (iSCSI)'), state: 'iscsi' },
        { name: T('Unix Shares (NFS)'), state: 'nfs' },
        { name: T('WebDAV Shares'), state: 'webdav' },
        { name: T('Windows Shares (SMB)'), state: 'smb' },
      ]
    },
    {
      name: T('Data Protection'),
      type: 'link',
      tooltip: T('Data Protection'),
      icon: 'security',
      state: 'tasks',
    },
    {
      name: T('Network'),
      type: 'link',
      tooltip: T('Network'),
      icon: 'device_hub',
      state: 'network',
    },
    {
      name: T('Credentials'),
      type: 'slideOut',
      tooltip: T('Credentials'),
      icon: 'vpn_key',
      state: 'credentials', // rename to credentials
      sub: [
        { name: T('Local Users'), state: 'users' },
        { name: T('Local Groups'), state: 'groups' },
        { name: T('Directory Services'), state: 'directory-services' },
        { name: T('Backup Credentials'), state: 'backup-credentials' },
        { name: T('Certificates'), state: 'certificates' },
        { name: T('2FA'), state: 'two-factor' },
        // KMIP probably needs to be moved to credentials routing component to work here
        // { name: T('KMIP'), state: 'kmip', disabled: true },
      ]
    },
    {
      name: T('Applications'),
      type: 'link',
      tooltip: T('Applications'),
      icon: 'apps',
      state: 'plugins', // rename to applications?
    },
    // {
    //   name: T('Virtualization'),
    //   type: 'slideOut',
    //   tooltip: T('Virtualization'),
    //   icon: 'computer',
    //   state: 'virtualization',
    //   sub: [
    //     { name: T('Jails'), state: 'jails' },
    //     { name: T('Virtual Machines'), state: 'vm' },
    //   ]
    // },
    {
      name: T('Virtualization'),
      type: 'link',
      tooltip: T('Virtualization'),
      icon: 'computer',
      state: 'vm',
    },
    {
      name: T('Apps'),
      type: 'link',
      tooltip: T('Apps'),
      icon: 'apps',
      state: 'apps',
    },
    {
      name: T('Reporting'),
      type: 'link',
      tooltip: T('Reports'),
      icon: 'insert_chart',
      state: 'reportsdashboard',
    },
    {
      name: T('System Settings'),
      type: 'slideOut',
      tooltip: T('System Settings'),
      icon: 'settings',
      state: 'system',
      sub: [
        { name: T('Update'), state: 'update' },
        { name: T('General'), state: 'general' },
        { name: T('Advanced'), state: 'advanced' },
        { name: T('Boot'), state: 'boot' },
        { name: T('Failover'), state: 'failover', disabled: true },
        { name: T('Services'), state: 'services' },
        { name: T('Shell'), state: 'shell' },
      ]
    }
  ]

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle = 'Frequently Accessed';
  // sets defaultMenu as default;
  menuItems = new BehaviorSubject < IMenuItem[] > (this.defaultMenu);
  // navigation component has subscribed this Observable
  menuItems$ = this.menuItems.asObservable();



  constructor() { }

  publishNavigationChange(menuType: string) {
    this.menuItems.next(this.defaultMenu);
  }
}
