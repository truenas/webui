export interface ForceSidenavEvent {
  name: 'ForceSidenav';
  sender: unknown;
  data: 'open' | 'close';
}
