export interface AppBarItem {
  name: string;
  icon: string;
  iconActive: string;
  state: string;
  status: 'open' | 'minimized';
}
