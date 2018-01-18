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
  constructor() {}

  defaultMenu: IMenuItem[] = [{
      name: 'Dashboard',
      type: 'link',
      tooltip: 'Dashboard',
      icon: 'dashboard',
      state: 'dashboard',
    },
    {
      name: 'Account',
      type: 'dropDown',
      tooltip: 'Account',
      icon: 'people',
      state: 'account',
      sub: [
        { name: 'Groups', state: 'groups' },
        { name: 'Users', state: 'users' },
      ]
    },
    {
      name: 'System',
      type: 'dropDown',
      tooltip: 'System',
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
      name: 'Tasks',
      type: 'dropDown',
      tooltip: 'Tasks',
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
      name: 'Network',
      type: 'dropDown',
      tooltip: 'Network',
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
      name: 'Storage',
      type: 'dropDown',
      tooltip: 'Storage',
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
      name: 'Directory Service',
      type: 'dropDown',
      tooltip: 'Directory Service',
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
      name: 'Sharing',
      type: 'dropDown',
      tooltip: 'Sharing',
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
      name: 'Services',
      type: 'link',
      tooltip: 'Services',
      icon: 'tune',
      state: 'services'
    },
    {
      name: 'Plugins',
      type: 'dropDown',
      tooltip: 'Plugins',
      icon: 'extension',
      state: 'plugins',
      sub: [
        {name: 'Available', state: 'available'},
        {name: 'Installed', state: 'installed'},
      ]
    },
    {
      name: 'Jails',
      type: 'link',
      tooltip: 'Jails',
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
      name: 'VMs',
      type: 'link',
      tooltip: 'Virtualization',
      icon: 'laptop_windows',
      state: 'vm'
    },
    {
      name: 'Reporting',
      type: 'link',
      tooltip: 'Reports',
      icon: 'insert_chart',
      state: 'reportsdashboard',
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
      name: 'Display System Processes',
      type: 'link',
      tooltip: 'System Processes',
      icon: 'perm_data_setting',
      state: 'systemprocesses'
    },
    {
      name: 'Shell',
      type: 'link',
      tooltip: 'Shell',
      icon: 'code',
      state: 'shell'
    },
    {
      name: 'Guide',
      type: 'link',
      tooltip: 'Guide',
      icon: 'info',
      state: 'guide',
    }
  ]

  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle: string = 'Frequently Accessed';
  // sets defaultMenu as default;
  menuItems = new BehaviorSubject < IMenuItem[] > (this.defaultMenu);
  // navigation component has subscribed this Observable
  menuItems$ = this.menuItems.asObservable();

  publishNavigationChange(menuType: string) {
    this.menuItems.next(this.defaultMenu);
  }
}
