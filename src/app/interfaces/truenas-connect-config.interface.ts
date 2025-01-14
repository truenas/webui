import { TruenasConnectStatus, TruenasConnectStatusReason } from 'app/enums/truenas-connect-status.enum';

export interface TruenasConnectConfig {
  id: number;
  enabled: boolean;
  registration_details: {
    scopes: string[];
    account_id: string;
    system_id: string;
    account_name: string;
    exp: number;
    iat: number;
    iss: string;
  };
  ips: number[];
  status: TruenasConnectStatus;
  status_reason: typeof TruenasConnectStatusReason;
  certificate: number;
}
