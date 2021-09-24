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

export interface IpmiIdentify {
  seconds?: number;
  force?: boolean;
}

export interface IpmiUpdate {
  dhcp: boolean;
  gateway: string;
  ipaddress: string;
  netmask: string;
  vlan: unknown;
  password: string;
}
