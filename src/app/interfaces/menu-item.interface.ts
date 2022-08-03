import { Observable } from 'rxjs';

export enum MenuItemType {
  Link = 'link',
  SlideOut = 'slideOut',
  Separator = 'separator',
  ExternalLink = 'extLink',
}

export interface MenuItem {
  type: MenuItemType;
  name?: string; // Used as display text for item and title for separator type
  state?: string;
  icon?: string;
  tooltip?: string;
  sub?: SubMenuItem[];
  isVisible$?: Observable<boolean>;
}

export interface SubMenuItem {
  name: string;
  state: string;
  isVisible$?: Observable<boolean>;
}
