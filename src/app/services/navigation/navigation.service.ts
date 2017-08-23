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
      state: 'dashboard'
    },
    {
      name: 'Account',
      type: 'link',
      tooltip: 'Account',
      icon: 'people',
      state: 'account'
    },
    {
      name: 'System',
      type: 'link',
      tooltip: 'System',
      icon: 'computer',
      state: 'system'
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
      type: 'link',
      tooltip: 'Network',
      icon: 'device_hub',
      state: 'network'
    },
    {
      name: 'Storage',
      type: 'link',
      tooltip: 'Storage',
      icon: 'storage',
      state: 'storage'
    },
    {
      name: 'Directory Service',
      type: 'link',
      tooltip: 'Directory Service',
      icon: 'group_work',
      state: 'directoryservice'
    },
    {
      name: 'Sharing',
      type: 'link',
      tooltip: 'Sharing',
      icon: 'folder_shared',
      state: 'sharing'
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
      type: 'link',
      tooltip: 'Plugins',
      icon: 'extension',
      state: 'plugins'
    },
    {
      name: 'Jails',
      type: 'link',
      tooltip: 'Jails',
      icon: 'apps',
      state: 'jails'
    },
    {
      name: 'Virtualization',
      type: 'link',
      tooltip: 'Virtualization',
      icon: 'laptop_windows',
      state: 'virtualization'
    },
    {
      name: 'Reporting',
      type: 'link',
      tooltip: 'Reporting',
      icon: 'show_chart',
      state: 'reporting'
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
//  },
    {
      name: 'SHELL',
      type: 'link',
      tooltip: 'Shell',
      icon: 'code',
      state: 'shell'
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