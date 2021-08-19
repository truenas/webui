export interface Ipmi {
  channel: number;
  dhcp: boolean;
  gateway: string;
  id: number;
  ipaddress: string;
  netmask: string;
  vlan: unknown;
}
