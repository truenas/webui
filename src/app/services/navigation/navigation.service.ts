import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  

  defaultMenu: IMenuItem[] = [{
      name: 'DASHBOARD',
      type: 'link',
      tooltip: 'DASHBOARD',
      icon: 'dashboard',
      state: 'dashboard',
    },
    {
      name: 'ACCOUNT',
      type: 'dropDown',
      tooltip: 'ACCOUNT',
      icon: 'people',
      state: 'account',
      sub: [
        { name: 'GROUPS', state: 'groups' },
        { name: 'USERS', state: 'users' },
      ]
    },
    {
      name: 'SYSTEM',
      type: 'dropDown',
      tooltip: 'SYSTEM',
      icon: 'computer',
      state: 'system',
      sub: [
        //{name: 'Information', state: 'information'},
        { name: 'General', state: 'general' },
        { name: 'NTP Servers', state: 'ntpservers' },
        { name: 'Boot', state: 'bootenv' },
        { name: 'Advanced', state: 'advanced' },
        {name: 'Email', state: 'email'},
        {name: 'System Dataset', state: 'dataset'},
        { name: 'Alert Services', state: 'alertservice' },
        { name: 'Cloud Credentials', state: 'cloudcredentials' },
        { name: 'Tunables', state: 'tunable' },
        { name: 'Update', state: 'update' },
        { name: 'CAs', state: 'ca' },
        { name: 'Certificates', state: 'certificates' },
        { name: 'Support', state: 'support' },
      ]
    },
    {
      name: 'TASKS',
      type: 'dropDown',
      tooltip: 'TASKS',
      icon: 'date_range',
      state: 'tasks',
      sub: [
        // { name: 'Calendar', state: 'calendar' },
        { name: 'Cron Jobs', state: 'cron' },
        { name: 'Init/Shutdown Scripts', state: 'initshutdown' },
        { name: 'Rsync Tasks', state: 'rsync' },
        { name: 'S.M.A.R.T Tests', state: 'smart' },
        { name: 'Periodic Snapshot Tasks', state: 'snapshot' },
        { name: 'Replication Tasks', state: 'replication' },
        { name: 'Scrub Tasks', state: 'scrub' },
      ]
    },
    {
      name: 'NETWORK',
      type: 'dropDown',
      tooltip: 'NETWORK',
      icon: 'device_hub',
      state: 'network',
      sub: [
        { name: 'Global Configuration', state: 'configuration' },
        { name: 'Interfaces', state: 'interfaces' },
        { name: 'IPMI', state: 'ipmi', disabled: false },
        { name: 'Link Aggregations', state: 'laggs' },
        //        {name: 'Network Summary', state: 'networksummary'},
        { name: 'Static Routes', state: 'staticroutes' },
        { name: 'VLANs', state: 'vlans' },
      ]
    },
    {
      name: 'STORAGE',
      type: 'dropDown',
      tooltip: 'STORAGE',
      icon: 'storage',
      state: 'storage',
      sub: [
        { name: 'Volumes', state: 'volumes' },
        { name: 'Snapshots', state: 'snapshots' },
        { name: 'VMware-Snapshots', state: 'vmware-Snapshots' },
        { name: 'Disks', state: 'disks' },
        { name: 'Import Disk', state: 'import-disk'},
      ]
    },
    {
      name: 'DIRECTORY_SERVICE',
      type: 'dropDown',
      tooltip: 'DIRECTORY_SERVICE',
      icon: 'group_work',
      state: 'directoryservice',
      sub: [
        { name: 'Active Directory', state: 'activedirectory' },
        { name: 'LDAP', state: 'ldap' },
        { name: 'NIS', state: 'nis' },
        { name: 'Kerberos Realms', state: 'kerberosrealms' },
        { name: 'Kerberos Settings', state: 'kerberossettings' },
      ]
    },
    {
      name: 'SHARING',
      type: 'dropDown',
      tooltip: 'SHARING',
      icon: 'folder_shared',
      state: 'sharing',
      sub: [
        { name: 'Apple (AFP) Shares', state: 'afp' },
        { name: 'Unix (NFS) Shares', state: 'nfs' },
        { name: 'WebDAV Shares', state: 'webdav' },
        { name: 'Windows (SMB) Shares', state: 'smb' },
        { name: 'Block (iSCSI)', state: 'iscsi' },
      ]
    },
    {
      name: 'SERVICES',
      type: 'link',
      tooltip: 'SERVICES',
      icon: 'tune',
      state: 'services'
    },
    {
      name: 'PLUGINS',
      type: 'dropDown',
      tooltip: 'PLUGINS',
      icon: 'extension',
      state: 'plugins',
      sub: [
        {name: 'Available', state: 'available'},
        {name: 'Installed', state: 'installed'},
      ]
    },
    {
      name: 'JAILS',
      type: 'link',
      tooltip: 'JAILS',
      icon: 'apps',
      state: 'jails',
      // sub: [
      //   { name: 'Instances', state: 'jails' },
      //   // {name: 'Storage', state: 'storage'},
      //   // {name: 'Templates', state: 'templates'},
      //   // {name: 'Configuration', state: 'configuration'},
      // ]
    },
    {
      name: 'REPORTING',
      type: 'link',
      tooltip: 'REPORTING',
      icon: 'insert_chart',
      state: 'reportsdashboard',
    },
    {
      name: 'VIRTUAL_MACHINES',
      type: 'link',
      tooltip: 'VIRTUAL_MACHINES',
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
      name: 'DISPLAY_SYSTEM_PROCESSES',
      type: 'link',
      tooltip: 'SYSTEM_PROCESSES',
      icon: 'perm_data_setting',
      state: 'systemprocesses'
    },
    {
      name: 'SHELL',
      type: 'link',
      tooltip: 'SHELL',
      icon: 'code',
      state: 'shell'
    },
    {
      name: 'GUIDE',
      type: 'link',
      tooltip: 'GUIDE',
      icon: 'info',
      state: 'guide',
    }
  ]

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle = 'Frequently Accessed';
  // sets defaultMenu as default;
  menuItems = new BehaviorSubject < IMenuItem[] > (this.defaultMenu);
  // navigation component has subscribed this Observable
  menuItems$ = this.menuItems.asObservable();

  constructor() {}

  publishNavigationChange(menuType: string) {
    this.menuItems.next(this.defaultMenu);
  }
}
