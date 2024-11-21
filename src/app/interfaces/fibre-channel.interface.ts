export interface FibreChannelPort {
  id: number;
  port: string;
  wwpn: string | null;
  wwpn_b: string | null;
  target: unknown; // TODO: Probably IscsiTarget
}

export interface FibreChannelPortUpdate {
  port: string;
  target_id: number;
}

export type FibreChannelPortChoices = Record<string, {
  wwpn: string;
  wwpn_b: string;
}>;
