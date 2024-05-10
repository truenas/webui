import { LinkState } from 'app/enums/network-interface.enum';

export interface WidgetNetworkInterfaceInfo {
  name: string;
  ip: string;
  state: LinkState;
  bitsIn: number;
  bitsOut: number;
  bitsLastSent: number;
  bitsLastReceived: number;
}
