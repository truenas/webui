import { IpmiChassisIdentifyState } from 'app/enums/ipmi.enum';

export interface Ipmi {
  channel: number;
  dhcp: boolean;
  gateway: string;
  id: number;
  ipaddress: string;
  netmask: string;
  vlan: unknown;
  password?: string;
}

export interface IpmiUpdate {
  dhcp: boolean;
  gateway: string;
  ipaddress: string;
  netmask: string;
  vlan: unknown;
  password: string;
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
