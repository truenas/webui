import { IscsiTarget } from 'app/interfaces/iscsi.interface';

export interface FibreChannelPort {
  id: number;
  port: string;
  wwpn: string | null;
  wwpn_b: string | null;
  target: IscsiTarget;
}

export interface FibreChannelPortUpdate {
  port: string;
  target_id: number;
}

export type FibreChannelPortChoices = Record<string, {
  wwpn: string;
  wwpn_b: string;
}>;
