export interface FibreChannelPort {
  id: number;
  port: string;
  wwpn: string | null;
  wwpn_b: string | null;
  target: FibreChannelTarget;
}

export interface FibreChannelTarget {
  id: number;
  iscsi_target_name: string;
  iscsi_target_alias: string | null;
  iscsi_target_mode: string;
  iscsi_target_auth_networks: string[];
  iscsi_target_rel_tgt_id: number;
}

export interface FibreChannelPortUpdate {
  port: string;
  target_id: number;
}

export type FibreChannelPortChoices = Record<string, {
  wwpn: string;
  wwpn_b: string;
}>;

export interface FibreChannelStatusNode {
  port_type: string;
  port_state: string;
  speed: string;
  physical: boolean;
  wwpn?: string;
  wwpn_b?: string;
  sessions: string[];
}

export interface FibreChannelStatus {
  port: string;
  A: FibreChannelStatusNode;
  B: FibreChannelStatusNode;
}

export interface FibreChannelHost {
  id: number;
  alias: string;
  wwpn: string;
  wwpn_b: string;
  npiv: number;
}
