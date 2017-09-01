import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface IMenuItem {
  type: string,       // Possible values: link/dropDown/icon/separator/extLink
  name?: string,      // Used as display text for item and title for separator type
  state?: string,     // Router state
  icon?: string,      // Item icon name
  tooltip?: string,   // Tooltip text 
  disabled?: boolean, // If true, item will not be appeared in sidenav.
  sub?: IChildItem[]  // Dropdown items
}
interface IChildItem {
  name: string,       // Display text
  state: string       // Router state
}

@Injectable()
export class NavigationService {
  constructor() {}

  defaultMenu:IMenuItem[] = [
    {
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
        {name: 'Users', state: 'users'},
        {name: 'Groups', state: 'groups'},
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
        {name: 'General', state: 'general'},
        {name: 'Advanced', state: 'advanced'},
        {name: 'Boot Environments', state: 'bootenv'},
        //{name: 'Email', state: 'email'},
        //{name: 'System Dataset', state: 'systemdataset'},
        //{name: 'Alert Services', state: 'alertservices'},
        {name: 'Tunables', state: 'tunable'},
        {name: 'Update', state: 'update'},
        {name: 'NTPServers', state: 'ntpservers'},
        {name: 'CAs', state: 'ca'},
        {name: 'Certificates', state: 'certificates'},
        {name: 'Support', state: 'support'},
      ]
    },
//    {
//      name: 'Tasks',
//      type: 'link',
//      tooltip: 'Tasks',
//      icon: 'playlist_add_check',
//      state: 'tasks'
//    },
    {
      name: 'Network',
      type: 'dropDown',
      tooltip: 'Network',
      icon: 'device_hub',
      state: 'network',
      sub: [
        {name: 'Global Configuration', state: 'configuration'},
        {name: 'Interfaces', state: 'interfaces'},
//        {name: 'IPMI', state: 'ipmi'},
        {name: 'Link Aggregation', state: 'laggs'},
//        {name: 'Network Summary', state: 'networksummary'},
        {name: 'Static Routes', state: 'staticroutes'},
        {name: 'VLANs', state: 'vlans'},
      ]
    },
    {
      name: 'Storage',
      type: 'dropDown',
      tooltip: 'Storage',
      icon: 'storage',
      state: 'storage'
    },
    {
      name: 'Directory Service',
      type: 'dropDown',
      tooltip: 'Directory Service',
      icon: 'group_work',
      state: 'directoryservice',
      sub: [
        {name: 'ActiveDirectory', state: 'activedirectory'},
        {name: 'LDAP', state: 'ldap'},
        {name: 'NIS', state: 'nis'},
      ]
    },
    {
      name: 'Sharing',
      type: 'dropDown',
      tooltip: 'Sharing',
      icon: 'folder_shared',
      state: 'sharing',
      sub: [
        {name: 'AFP', state: 'afp'},
        {name: 'NFS', state: 'nfs'},
        {name: 'WebDAV', state: 'webdav'},
        {name: 'SMB', state: 'smb'},
        {name: 'ISCSI', state: 'iscsi'},
      ]
    },
    {
      name: 'Services',
      type: 'dropDown',
      tooltip: 'Services',
      icon: 'tune',
      state: 'services'
    },
    {
      name: 'Plugins',
      type: 'dropDown',
      tooltip: 'Plugins',
      icon: 'extension',
      state: 'plugins'
    },
    {
      name: 'Jails',
      type: 'dropDown',
      tooltip: 'Jails',
      icon: 'apps',
      state: 'jails',
      sub: [
        {name: 'Instances', state: 'jails'},
        {name: 'Storage', state: 'storage'},
        {name: 'Templates', state: 'templates'},
        {name: 'Configuration', state: 'configuration'},
      ]
    },
    {
      name: 'Virtualization',
      type: 'link',
      tooltip: 'Virtualization',
      icon: 'laptop_windows',
      state: 'vm'
    },{
      name: 'Reporting',
      type: 'link',
      tooltip: 'Services',
      icon: 'reports',
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
      name: 'SHELL',
      type: 'link',
      tooltip: 'Shell',
      icon: 'code',
      state: 'shell'
    },
    {
      name: 'Guide',
      type: 'extLink',
      tooltip: 'Guide',
      icon: 'info',
      state: 'http://doc.freenas.org/11/freenas.html',
    }
  ]
  
  // Icon menu TITLE at the very top of navigation.
  // This title will appear if any icon type item is present in menu.
  iconTypeMenuTitle:string = 'Frequently Accessed';
  // sets defaultMenu as default;
  menuItems = new BehaviorSubject<IMenuItem[]>(this.defaultMenu);
  // navigation component has subscribed this Observable
  menuItems$ = this.menuItems.asObservable();

  publishNavigationChange(menuType: string) {
    this.menuItems.next(this.defaultMenu);
  }
}