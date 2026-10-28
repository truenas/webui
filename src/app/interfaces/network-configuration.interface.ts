import { CallResponse, v28_0_0 } from '@truenas/api-client';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface NetworkConfiguration extends NetworkConfigurationState {
  activity: NetworkConfigurationActivity;
  domain: string;
  domains: string[];
  hostname: string;
  /** Absent entirely — not `null` — unless the system is HA capable. */
  hostname_b?: string;
  hostname_local: string;
  /** Absent entirely — not `null` — unless the system is HA capable. */
  hostname_virtual?: string;
  hosts: string[];
  httpproxy: string;
  id: number;
  service_announcement: NetworkServiceAnnouncement;
  state: NetworkConfigurationState;
}

export type NetworkConfigurationState = v28_0_0.NetWorkConfigurationState;

export interface NetworkServiceAnnouncement {
  mdns: true;
  wsd: true;
  netbios: false;
}

export interface NetworkConfigurationActivity {
  type: NetworkActivityType;
  activities: string[];
}

/**
 * Reads `network.configuration.config`. Middleware spells the activity type as a literal and types the HA
 * hostnames as nullable.
 */
export function toNetworkConfiguration(
  config: CallResponse<WebUiApiDirectory, 'network.configuration.config'>,
): NetworkConfiguration {
  return config as unknown as NetworkConfiguration;
}
