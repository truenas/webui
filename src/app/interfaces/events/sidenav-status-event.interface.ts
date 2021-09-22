import { MatDrawerMode } from '@angular/material/sidenav';

export interface SidenavStatusEvent {
  name: 'SidenavStatus';
  sender: unknown;
  data: {
    isOpen: boolean;
    mode: MatDrawerMode;
    isCollapsed: boolean;
  };
}
