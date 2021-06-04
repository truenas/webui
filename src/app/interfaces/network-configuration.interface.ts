import { NetworkActivityType } from 'app/enums/network-activity-type.enum';

export interface NetworkConfiguration {
  activity: NetworkConfigurationActivity;
  domain: string;
  domains: any[];
  hostname: string;
  hostname_b: string;
  hostname_local: string;
  hostname_virtual: any;
  hosts: string;
  httpproxy: string;
  id: number;
  ipv4gateway: string;
  ipv6gateway: string;
  nameserver1: string;
  nameserver2: string;
  nameserver3: string;
  netwait_enabled: boolean;
  netwait_ip: any[];
  service_announcement: NetworkServiceAnnouncement;
  state: NetworkConfigurationState;
}

export interface NetworkConfigurationState {
  ipv4gateway: string;
  ipv6gateway: string;
  nameserver1: string;
  nameserver2: string;
  nameserver3: string;
}

export interface NetworkServiceAnnouncement {
  mdns: true;
  wsd: true;
  netbios: false;
}

export interface NetworkConfigurationActivity {
  type: NetworkActivityType;
  activities: any[];
}

export type NetworkActivityChoice = [
  /* value */ string,
  /* label */ string,
];
