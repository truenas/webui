import { NetworkActivityType } from 'app/enums/network-activity-type.enum';

export interface NetworkConfiguration extends NetworkConfigurationState {
  activity: NetworkConfigurationActivity;
  domain: string;
  domains: string[];
  hostname: string;
  hostname_b: string;
  hostname_local: string;
  hostname_virtual: string;
  hosts: string[];
  httpproxy: string;
  id: number;
  service_announcement: NetworkServiceAnnouncement;
  state: NetworkConfigurationState;
}

export interface NetworkConfigurationConfig extends NetworkConfigurationState, NetworkServiceAnnouncement {
  inherit_dhcp: boolean;
  domain: string;
  domains: string[];
  hostname: string;
  hostname_b: string;
  hostname_virtual: string;
  hosts: string[];
  httpproxy: string;
  outbound_network_activity: NetworkActivityType;
  outbound_network_value: string[];
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
  activities: string[];
}

export interface NetworkConfigurationUpdate extends NetworkConfigurationState {
  activity: NetworkConfigurationActivity;
  domain: string;
  domains: string[];
  hostname: string;
  hostname_b: string;
  hostname_virtual: string;
  hosts: string[];
  httpproxy: string;
  service_announcement: NetworkServiceAnnouncement;
}
