import { MatDrawerMode } from '@angular/material/sidenav';

export interface SidenavStatusData {
  isOpen: boolean;
  mode: MatDrawerMode;
  isCollapsed: boolean;
}

export interface SidenavStatusEvent {
  name: 'SidenavStatus';
  sender: unknown;
  data: SidenavStatusData;
}
