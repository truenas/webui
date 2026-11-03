import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';

export interface WebShareConfig {
  id: number;
  search: boolean;
  passkey: WebSharePasskey;
  groups: string[];
  mcp_enabled: boolean;
  mcp_allowed_groups: string[];
  mcp_allow_write: boolean;
}

export interface WebShareConfigUpdate {
  search?: boolean;
  passkey?: WebSharePasskey;
  bindip?: string[];
  groups?: number[];
  mcp_enabled?: boolean;
  mcp_allowed_groups?: string[];
  mcp_allow_write?: boolean;
}

export interface WebShare {
  id: number;
  name: string;
  path: string;
  locked?: boolean;
  is_home_base?: boolean;
}

export type WebShareUpdate = Omit<WebShare, 'id' | 'locked'>;
