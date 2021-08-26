import { Ipmi } from 'app/interfaces/ipmi.interface';

export interface IpmiRow extends Ipmi {
  channelLabel: string;
}
