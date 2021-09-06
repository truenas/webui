import { NetworkInterface } from 'app/interfaces/network-interface.interface';

export interface ThemeListsChangedEvent {
  name: 'ThemeListsChanged';
  sender: unknown;
  data: void;
}
