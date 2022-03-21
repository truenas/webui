import { Injectable } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from 'app/interfaces/menu-item.interface';

@Injectable()
export class NavigationService {
  // all menu for truenas enterprise features
  enterpriseFeatures = [
    { menu: 'system', sub: 'kmip' },
  ];

  // all menu for iXsystems hardware features
  hardwareFeatures = [
    { menu: 'system', sub: 'viewenclosure' },
  ];

  defaultMenu: MenuItem[] = [{
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
    type: 'link',
    tooltip: T('Shares'),
    icon: 'folder_shared',
    state: 'sharing',
  },
  {
    name: T('Data Protection'),
    type: 'link',
    tooltip: T('Data Protection'),
    icon: 'security',
    state: 'data-protection',
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
    ],
  },
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
      { name: T('Enclosure'), state: 'viewenclosure', disabled: true },
    ],
  },
  ];

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle = 'Frequently Accessed';
  // sets defaultMenu as default;
  menuItems$ = new BehaviorSubject<MenuItem[]>(this.defaultMenu);
}
