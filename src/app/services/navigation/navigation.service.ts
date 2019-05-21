import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { T } from '../../translate-marker';

import * as _ from 'lodash';

interface IMenuItem {
  type: string, // Possible values: link/dropDown/icon/separator/extLink
  name ? : string, // Used as display text for item and title for separator type
  state ? : string, // Router state
  icon ? : string, // Item icon name
  tooltip ? : string, // Tooltip text 
  disabled ? : boolean, // If true, item will not be appeared in sidenav.
  sub ? : IChildItem[] // Dropdown items
}
interface IChildItem {
  name: string, // Display text
  state: string, // Router state
  disabled ? : boolean, // If true, item will not be appeared in sidenav.
}

@Injectable()
export class NavigationService {
  // all menu for truenas features
  public turenasFeatures = [
    { menu: 'system', sub: 'proactivesupport' }
  ];

  defaultMenu: IMenuItem[] = [{
      name: T('Dashboard'),
      type: 'link',
      tooltip: T('Dashboard'),
      icon: 'dashboard',
      state: 'dashboard',
    },
    {
      name: T('Accounts'),
      type: 'dropDown',
      tooltip: T('Accounts'),
      icon: 'people',
      state: 'account',
      sub: [
        { name: T('Groups'), state: 'groups' },
        { name: T('Users'), state: 'users' },
      ]
    },
    {
      name: T('System'),
      type: 'dropDown',
      tooltip: T('System'),
      icon: 'computer',
      state: 'system',
      sub: [
        //{name: 'Information', state: 'information'},
        { name: T('General'), state: 'general' },
        { name: T('NTP Servers'), state: 'ntpservers' },
        { name: T('Boot Environments'), state: 'bootenv' },
        { name: T('Advanced'), state: 'advanced' },
        { name: T('View Enclosure'), state: 'viewenclosure'/*, disabled: true*/},
        { name: T('Email'), state: 'email'},
        { name: T('Reporting'), state: 'reporting'},
        { name: T('System Dataset'), state: 'dataset'},
        { name: T('Alert Services'), state: 'alertservice' },
        { name: T('Alert Settings'), state: 'alertsettings' },
        { name: T('Cloud Credentials'), state: 'cloudcredentials' },
        { name: T('SSH Connections'), state: 'sshconnections'},
        { name: T('SSH Keypairs'), state: 'sshkeypairs'},
        { name: T('Tunables'), state: 'tunable' },
        { name: T('Update'), state: 'update' },
        { name: T('CAs'), state: 'ca' },
        { name: T('Certificates'), state: 'certificates' },
        { name: T('ACME DNS'), state: 'acmedns' },
        { name: T('Failover'), state: 'failover', disabled: true },
        { name: T('Support'), state: 'support' },
        { name: T('Proactive Support'), state: 'proactivesupport', disabled: true },
      ]
    },
    {
      name: T('Tasks'),
      type: 'dropDown',
      tooltip: T('Tasks'),
      icon: 'date_range',
      state: 'tasks',
      sub: [
        // { name: 'Calendar', state: 'calendar' },
        { name: T('Cron Jobs'), state: 'cron' },
        { name: T('Init/Shutdown Scripts'), state: 'initshutdown' },
        { name: T('Rsync Tasks'), state: 'rsync' },
        { name: T('S.M.A.R.T. Tests'), state: 'smart' },
        { name: T('Periodic Snapshot Tasks'), state: 'snapshot' },
        { name: T('Replication Tasks'), state: 'replication' },
        { name: T('Resilver Priority'), state: 'resilver' },
        { name: T('Scrub Tasks'), state: 'scrub' },
        { name: T('Cloud Sync Tasks'), state: 'cloudsync'},
      ]
    },
    {
      name: T('Network'),
      type: 'dropDown',
      tooltip: T('Network'),
      icon: 'device_hub',
      state: 'network',
      sub: [
        { name: T('Global Configuration'), state: 'configuration' },
        { name: T('Interfaces'), state: 'interfaces' },
        { name: T('IPMI'), state: 'ipmi', disabled: false },
        { name: T('Network Summary'), state: 'summary' },
        { name: T('Static Routes'), state: 'staticroutes' },
      ]
    },
    {
      name: T('Storage'),
      type: 'dropDown',
      tooltip: T('Storage'),
      icon: 'storage',
      state: 'storage',
      sub: [
        { name: T('Pools'), state: 'pools' },
        { name: T('Snapshots'), state: 'snapshots' },
        { name: T('VMware-Snapshots'), state: 'vmware-Snapshots' },
        { name: T('Disks'), state: 'disks' },
        { name: T('Import Disk'), state: 'import-disk'},
        { name: T('Multipaths'), state: 'multipaths', disabled: false},
      ]
    },
    {
      name: T('Directory Services'),
      type: 'dropDown',
      tooltip: T('Directory Services'),
      icon: 'group_work',
      state: 'directoryservice',
      sub: [
        { name: T('Active Directory'), state: 'activedirectory' },
        { name: T('LDAP'), state: 'ldap' },
        { name: T('NIS'), state: 'nis' },
        { name: T('Kerberos Realms'), state: 'kerberosrealms' },
        { name: T('Kerberos Keytabs'), state: 'kerberoskeytabs' },
        { name: T('Kerberos Settings'), state: 'kerberossettings' },
      ]
    },
    {
      name: T('Sharing'),
      type: 'dropDown',
      tooltip: T('Sharing'),
      icon: 'folder_shared',
      state: 'sharing',
      sub: [
        { name: T('Apple (AFP) Shares'), state: 'afp' },
        { name: T('Unix (NFS) Shares'), state: 'nfs' },
        { name: T('WebDAV Shares'), state: 'webdav' },
        { name: T('Windows (SMB) Shares'), state: 'smb' },
        { name: T('Block (iSCSI)'), state: 'iscsi' },
      ]
    },
    {
      name: T('Services'),
      type: 'link',
      tooltip: T('Services'),
      icon: 'tune',
      state: 'services'
    },
    {
      name: T('Plugins'),
      type: 'dropDown',
      tooltip: T('Plugins'),
      icon: 'extension',
      state: 'plugins',
      sub: [
        {name: 'Available', state: 'available'},
        {name: 'Installed', state: 'installed'},
      ]
    },
    {
      name: T('Jails'),
      type: 'link',
      tooltip: T('Jails'),
      icon: 'jail_icon',
      //icon: 'apps',
      state: 'jails',
      // sub: [
      //   { name: 'Jails', state: 'jails' },
      //   // {name: 'Storage', state: 'storage'},
      //   // {name: 'Templates', state: 'templates'},
      //   // {name: 'Configuration', state: 'configuration'},
      // ]
    },
    {
      name: T('Reporting'),
      type: 'link',
      tooltip: T('Reports'),
      icon: 'insert_chart',
      state: 'reportsdashboard',
    },
    {
      name: T('Virtual Machines'),
      type: 'link',
      tooltip: T('Virtualization'),
      icon: 'laptop_windows',
      state: 'vm'
    },
    //  {
    //    name: 'GUIDE',
    //    type: 'link',
    //    tooltip: 'Storage',
    //    icon: 'storage',
    //    state: 'storage'
    //  },
    //    {
    //      name: 'WIZARD',
    //      type: 'link',
    //      tooltip: 'Wizard',
    //     icon: 'cake',
    //    state: 'wizard'
    //  }
    {
      name: T('Display System Processes'),
      type: 'link',
      tooltip: T('System Processes'),
      icon: 'perm_data_setting',
      state: 'systemprocesses'
    },
    {
      name: T('Shell'),
      type: 'link',
      tooltip: T('Shell'),
      icon: 'console-line',
      state: 'shell'
    },
    {
      name: T('Guide'),
      type: 'extLink',
      tooltip: T('Guide'),
      icon: 'info',
      state: '',
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
