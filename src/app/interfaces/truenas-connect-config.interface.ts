import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';

export interface TruenasConnectConfig extends TruenasConnectUpdate {
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
  status: TruenasConnectStatus;
  status_reason: string;
  certificate: number;
  interfaces_ips: string[];
}

export interface TruenasConnectUpdate {
  enabled: boolean;
  ips: string[];
  tnc_base_url: string;
  account_service_base_url: string;
  leca_service_base_url: string;
  heartbeat_url: string;
}
