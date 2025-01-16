import { Observable } from 'rxjs';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export enum MenuItemType {
  Link = 'link',
  SlideOut = 'slideOut',
}

export interface MenuItem {
  type: MenuItemType;
  name: string; // Used as display text for item and title for separator type
  state?: string;
  icon?: MarkedIcon;
  tooltip?: string;
  sub?: SubMenuItem[];
  isVisible$?: Observable<boolean>;
}

export interface SubMenuItem {
  name: string;
  state: string;
  isVisible$?: Observable<boolean>;
  hasAccess$?: Observable<boolean>;
}
