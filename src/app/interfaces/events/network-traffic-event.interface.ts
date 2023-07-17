import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';

export interface NetworkTrafficEvent {
  name: 'NetTraffic_*';
  sender: unknown;
  data: NetworkInterfaceUpdate;
}
