import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';

export interface AppBarItem {
  name: string;
  icon: MarkedIcon | string;
  iconActive: MarkedIcon | string;
  state: string;
  status: 'open' | 'minimized';
}
