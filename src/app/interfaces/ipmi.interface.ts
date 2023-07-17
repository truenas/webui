import { IpmiChassisIdentifyState, IpmiIpAddressSource } from 'app/enums/ipmi.enum';

export interface Ipmi {
  backup_gateway_ip_address: string;
  backup_gateway_mac_address: string;
  channel: number;
  default_gateway_ip_address: string;
  default_gateway_mac_address: string;
  id: number;
  ip_address: string;
  ip_address_source: IpmiIpAddressSource;
  mac_addresss: string;
  subnet_mask: string;
  vlan_id: number;
  vlan_priority: number;
}

export interface IpmiUpdate {
  dhcp: boolean;
  gateway: string;
  ipaddress: string;
  netmask: string;
  vlan: unknown;
  password: string;
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
