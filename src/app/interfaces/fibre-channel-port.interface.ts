import { FibreChannelPortMode } from 'app/enums/fibre-channel-port-mode.enum';

export interface FibreChannelPort {
  name: string;
  wwpn: unknown;
  state: string;
}

export interface FibreChannelPortUpdate {
  mode: FibreChannelPortMode;
  target: number;
  initiators: string;
}
