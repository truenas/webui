import { HarborosConnectStatus } from 'app/enums/truenas-connect-status.enum';

export interface HarborosConnectConfig extends HarborosConnectUpdate {
  id: number;
  registration_details: {
    scopes: string[];
    account_id: string;
    system_id: string;
    account_name: string;
    exp: number;
    iat: number;
    iss: string;
  };
  status: HarborosConnectStatus;
  status_reason: string;
  certificate: number;
  interfaces_ips: string[];
  ips: string[];
  interfaces: string[];
  use_all_interfaces: boolean;
  tnc_base_url: string;
  account_service_base_url: string;
  leca_service_base_url: string;
  heartbeat_url: string;
}

export interface HarborosConnectUpdate {
  enabled: boolean;
  ips: string[];
  interfaces: string[];
  use_all_interfaces: boolean;
}
