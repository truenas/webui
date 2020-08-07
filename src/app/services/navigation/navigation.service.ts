import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { T } from '../../translate-marker';

import * as _ from 'lodash';

interface IMenuItem {
  type: string; // Possible values: link/dropDown/icon/separator/extLink
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
      type: 'link',
      tooltip: T('Shares'),
      icon: 'folder_shared',
      state: 'sharing',
    },
    {
      name: T('Data Protection'),
      type: 'link',
      tooltip: T('Dashboard'),
      icon: 'security',
      state: 'tasks',
    },
    {
      name: T('Network'),
      type: 'link',
      tooltip: T('Network'),
      icon: 'device_hub',
      state: 'system',
    },
    {
      name: T('Credentials'),
      type: 'slideOut',
      tooltip: T('Credentials'),
      icon: 'vpn_key',
      state: 'account',
      sub: [
        { name: T('Local Users'), state: 'users' },
        { name: T('Local Groups'), state: 'groups' },
        { name: T('Directory Services'), state: 'activedirectory' },
        { name: T('Backup Credentials'), state: 'cloudcredentials' },
        { name: T('Certificates'), state: 'certificates' },
        // { name: T('KMIP'), state: 'kmip', disabled: true },
        { name: T('2FA'), state: 'two-factor' },
      ]
    },
    {
      name: T('Applications'),
      type: 'link',
      tooltip: T('Applications'),
      icon: 'apps',
      state: 'plugins',
    },
    {
      name: T('Virtualization'),
      type: 'slideOut',
      tooltip: T('Virtualization'),
      icon: 'computer',
      state: 'account',
      sub: [
        { name: T('Jails'), state: 'jails' },
        { name: T('Virtual Machines'), state: 'vm' },
      ]
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
        { name: T('Alerts'), state: 'alertservice' },
        { name: T('General'), state: 'general' },
        { name: T('Advanced'), state: 'advanced' },
        { name: T('Boot'), state: 'boot' },
        // { name: T('Failover'), state: 'failover', disabled: true },
      ]
    },


    // {
    //   name: T('System'),
    //   type: 'slideOut',
    //   tooltip: T('System'),
    //   icon: 'computer',
    //   state: 'system',
    //   sub: [
    //     //{name: 'Information', state: 'information'},
    //     { name: T('General'), state: 'general' },
    //     { name: T('NTP Servers'), state: 'ntpservers' },
    //     { name: T('Boot'), state: 'boot' },
    //     { name: T('Advanced'), state: 'advanced' },
    //     // { name: T('View Enclosure'), state: 'viewenclosure', disabled: true},
    //     { name: T('Email'), state: 'email'},
    //     { name: T('System Dataset'), state: 'dataset'},
    //     { name: T('Reporting'), state: 'reporting'},
    //     { name: T('Alert Services'), state: 'alertservice' },
    //     { name: T('Alert Settings'), state: 'alertsettings' },
    //     { name: T('Cloud Credentials'), state: 'cloudcredentials' },
    //     { name: T('SSH Connections'), state: 'sshconnections'},
    //     { name: T('SSH Keypairs'), state: 'sshkeypairs'},
    //     { name: T('Tunables'), state: 'tunable', disabled: false },
    //     // { name: T('Sysctl'), state: 'sysctl', disabled: true },
    //     { name: T('Update'), state: 'update' },
    //     { name: T('CAs'), state: 'ca' },
    //     { name: T('Certificates'), state: 'certificates' },
    //     // { name: T('KMIP'), state: 'kmip', disabled: true },
    //     { name: T('ACME DNS'), state: 'acmedns' },
    //     // { name: T('Failover'), state: 'failover', disabled: true },
    //     { name: T('Support'), state: 'support' },
    //     { name: T('2FA'), state: 'two-factor' },
    //   ]
    // },
    // {
    //   name: T('Tasks'),
    //   type: 'slideOut',
    //   tooltip: T('Tasks'),
    //   icon: 'date_range',
    //   state: 'tasks',
    //   sub: [
    //     // { name: 'Calendar', state: 'calendar' },
    //     { name: T('Cron Jobs'), state: 'cron' },
    //     { name: T('Init/Shutdown Scripts'), state: 'initshutdown' },
    //     { name: T('Rsync Tasks'), state: 'rsync' },
    //     { name: T('S.M.A.R.T. Tests'), state: 'smart' },
    //     { name: T('Periodic Snapshot Tasks'), state: 'snapshot' },
    //     { name: T('Replication Tasks'), state: 'replication' },
    //     { name: T('Resilver Priority'), state: 'resilver' },
    //     { name: T('Scrub Tasks'), state: 'scrub' },
    //     { name: T('Cloud Sync Tasks'), state: 'cloudsync'},
    //   ]
    // },
    // {
    //   name: T('Network'),
    //   type: 'slideOut',
    //   tooltip: T('Network'),
    //   icon: 'device_hub',
    //   state: 'network',
    //   sub: [
    //     { name: T('Network Summary'), state: 'summary' },
    //     { name: T('Global Configuration'), state: 'configuration' },
    //     { name: T('Interfaces'), state: 'interfaces' },
    //     { name: T('Static Routes'), state: 'staticroutes' },
    //     { name: T('IPMI'), state: 'ipmi', disabled: false },
    //   ]
    // },
    // {
    //   name: T('Storage'),
    //   type: 'slideOut',
    //   tooltip: T('Storage'),
    //   icon: 'storage',
    //   state: 'storage',
    //   sub: [
    //     { name: T('Pools'), state: 'pools' },
    //     { name: T('Snapshots'), state: 'snapshots' },
    //     { name: T('VMware-Snapshots'), state: 'vmware-Snapshots' },
    //     { name: T('Disks'), state: 'disks' },
    //     { name: T('Import Disk'), state: 'import-disk'},
    //     { name: T('Multipaths'), state: 'multipaths', disabled: false},
    //   ]
    // },
    // {
    //   name: T('Directory Services'),
    //   type: 'slideOut',
    //   tooltip: T('Directory Services'),
    //   icon: 'group_work',
    //   state: 'directoryservice',
    //   sub: [
    //     { name: T('Active Directory'), state: 'activedirectory' },
    //     { name: T('LDAP'), state: 'ldap' },
    //     { name: T('NIS'), state: 'nis' },
    //     { name: T('Kerberos Realms'), state: 'kerberosrealms' },
    //     { name: T('Kerberos Keytabs'), state: 'kerberoskeytabs' },
    //     { name: T('Kerberos Settings'), state: 'kerberossettings' },
    //   ]
    // },
    // {
    //   name: T('Sharing'),
    //   type: 'slideOut',
    //   tooltip: T('Sharing'),
    //   icon: 'folder_shared',
    //   state: 'sharing',
    //   sub: [
    //     { name: T('Apple Shares (AFP)'), state: 'afp' },
    //     { name: T('Block Shares (iSCSI)'), state: 'iscsi' },
    //     { name: T('Unix Shares (NFS)'), state: 'nfs' },
    //     { name: T('WebDAV Shares'), state: 'webdav' },
    //     { name: T('Windows Shares (SMB)'), state: 'smb' },
    //   ]
    // },
    // {
    //   name: T('Services'),
    //   type: 'link',
    //   tooltip: T('Services'),
    //   icon: 'tune',
    //   state: 'services'
    // },
    // {
    //   name: T('Plugins'),
    //   type: 'link',
    //   tooltip: T('Plugins'),
    //   icon: 'extension',
    //   state: 'plugins',
    // },
    // {
    //   name: T('Jails'),
    //   type: 'link',
    //   tooltip: T('Jails'),
    //   icon: 'jail_icon',
    //   //icon: 'apps',
    //   state: 'jails',
    //   // sub: [
    //   //   { name: 'Jails', state: 'jails' },
    //   //   // {name: 'Storage', state: 'storage'},
    //   //   // {name: 'Templates', state: 'templates'},
    //   //   // {name: 'Configuration', state: 'configuration'},
    //   // ]
    // },
    // {
    //   name: T('Containers'),
    //   type: 'link',
    //   tooltip: T('Containers'),
    //   icon: 'folder_special',
    //   state: 'containers',
    // },
    // {
    //   name: T('Clustering'),
    //   type: 'link',
    //   tooltip: T('Clustering'),
    //   icon: 'zoom_out_map',
    //   state: 'clustering',
    // },
    // {
    //   name: T('Reporting'),
    //   type: 'link',
    //   tooltip: T('Reports'),
    //   icon: 'insert_chart',
    //   state: 'reportsdashboard',
    // },
    // {
    //   name: T('Virtual Machines'),
    //   type: 'link',
    //   tooltip: T('Virtualization'),
    //   icon: 'laptop_windows',
    //   state: 'vm'
    // },
    // //  {
    // //    name: 'GUIDE',
    // //    type: 'link',
    // //    tooltip: 'Storage',
    // //    icon: 'storage',
    // //    state: 'storage'
    // //  },
    // //    {
    // //      name: 'WIZARD',
    // //      type: 'link',
    // //      tooltip: 'Wizard',
    // //     icon: 'cake',
    // //    state: 'wizard'
    // //  }
    // {
    //   name: T('Display System Processes'),
    //   type: 'link',
    //   tooltip: T('System Processes'),
    //   icon: 'perm_data_setting',
    //   state: 'systemprocesses'
    // },
    // {
    //   name: T('Shell'),
    //   type: 'link',
    //   tooltip: T('Shell'),
    //   icon: 'console-line',
    //   state: 'shell'
    // },
    // {
    //   name: T('Guide'),
    //   type: 'extLink',
    //   tooltip: T('Guide'),
    //   icon: 'info',
    //   state: '',
    // }
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
