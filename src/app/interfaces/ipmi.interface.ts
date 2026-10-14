import { CallParams, CallResponse } from '@truenas/api-client';
import { IpmiChassisIdentifyState, IpmiIpAddressSource } from 'app/enums/ipmi.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface Ipmi {
  backup_gateway_ip_address: string;
  backup_gateway_mac_address: string;
  channel: number;
  default_gateway_ip_address: string;
  default_gateway_mac_address: string;
  id: number;
  ip_address: string;
  ip_address_source: IpmiIpAddressSource;
  mac_address: string;
  subnet_mask: string;
  vlan_id: number;
  vlan_id_enable: boolean;
  vlan_priority: number;
}

/**
 * `ipmi.lan.query` takes its filters and options inside one object, next to `ipmi-options`, so it is not a
 * typed query method and is called with `call`.
 */
export type IpmiQueryParams = CallParams<D, 'ipmi.lan.query'>;

/**
 * Reads what `ipmi.lan.query` returns for a plain query: its rows. Middleware declares one response for every
 * `query-options`, a count and a single entry included, and leaves every field of a channel optional.
 */
export function toIpmiChannels(response: CallResponse<D, 'ipmi.lan.query'>): Ipmi[] {
  return response as Ipmi[];
}

/**
 * `ipmi.lan.update` takes one shape when `dhcp` is on and another when it is off; the form edits them as one.
 * `toIpmiUpdateArgs` hands the payload over unchanged.
 */
export interface IpmiUpdate {
  dhcp: boolean;
  gateway: string;
  ipaddress: string;
  netmask: string;
  vlan: number | null;
  password?: string;
  apply_remote?: boolean;
}

export function toIpmiUpdateArgs(update: IpmiUpdate): CallParams<D, 'ipmi.lan.update'>[1] {
  return update as CallParams<D, 'ipmi.lan.update'>[1];
}

export interface IpmiEvent {
  id: number;
  date: string;
  time: string;
  name: string;
  type: string;
  event_direction: string;
  event: string;
}

export interface IpmiChassis {
  system_power: unknown;
  power_overload: unknown;
  interlock: unknown;
  power_fault: unknown;
  power_control_fault: unknown;
  power_restore_policy: unknown;
  last_power_event: unknown;
  chassis_intrusion: unknown;
  front_panel_lockout: unknown;
  drive_fault: unknown;
  'cooling/fan_fault': unknown;
  chassis_identify_state: IpmiChassisIdentifyState;
}
