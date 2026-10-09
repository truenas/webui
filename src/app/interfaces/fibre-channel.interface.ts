import { CallResponse } from '@truenas/api-client';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

export interface FcPortFormValue {
  port: string | null;
  host_id: number | null;
}

/**
 * Reads an `fcport.query` row into `FibreChannelPort`. Middleware declares the port's `target` as a loose record,
 * so a plain `as` does not compile and the cast checks nothing.
 */
export function toFibreChannelPort(entry: WebUiQueryEntity<'fcport.query'>): FibreChannelPort {
  return entry as unknown as FibreChannelPort;
}

/** Reads an `fc.fc_host.query` row into `FibreChannelHost`; middleware leaves `wwpn`, `wwpn_b` and `npiv` optional. */
export function toFibreChannelHost(entry: WebUiQueryEntity<'fc.fc_host.query'>): FibreChannelHost {
  return entry as FibreChannelHost;
}

/** Reads `fcport.status`, which middleware declares as `unknown[]`, as the per-port statuses it returns. */
export function toFibreChannelStatuses(statuses: CallResponse<WebUiApiDirectory, 'fcport.status'>): FibreChannelStatus[] {
  return statuses as FibreChannelStatus[];
}
