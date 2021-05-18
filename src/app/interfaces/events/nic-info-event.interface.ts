import { NetworkInterface } from 'app/interfaces/network-interface.interface';

export interface NicInfoEvent {
  name: 'NicInfo';
  sender: unknown;
  data: NetworkInterface[];
}
