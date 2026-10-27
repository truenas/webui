import { CallResponse } from '@truenas/api-client';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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
  tier: TruenasConnectTier | null;
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

export interface TruenasConnectUpdate {
  enabled: boolean;
  ips?: string[];
  interfaces?: string[];
  use_all_interfaces?: boolean;
}

/**
 * Reads `tn_connect.config`, `tn_connect.update` and the `tn_connect.config` change events. Middleware types
 * `status` as a plain string, `tier` as literals, `registration_details` as an open object and `certificate` as
 * nullable, and declares none of `ips`, `interfaces`, `interfaces_ips` or `use_all_interfaces`, which nothing in
 * the UI reads.
 */
export function toTruenasConnectConfig(
  config: CallResponse<WebUiApiDirectory, 'tn_connect.config'>,
): TruenasConnectConfig {
  return config as unknown as TruenasConnectConfig;
}
