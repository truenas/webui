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
      name: 'DASHBOARD',
      type: 'link',
      tooltip: 'Dashboard',
      icon: 'dashboard',
      state: 'dashboard'
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