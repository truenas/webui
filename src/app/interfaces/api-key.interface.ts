import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ApiKey {
  created_at: ApiTimestamp;
  expires_at: ApiTimestamp;
  id: number;
  keyhash: string;
  local: boolean;
  revoked: boolean;
  name: string;
  username: string;
  user_identifier: number;
}

export interface CreateApiKeyRequest {
  name: string;
  username?: string;
  allowlist?: ApiKeyAllowListItem[];
}

export type UpdateApiKeyRequest = [number, {
  name: string;
  reset?: boolean;
}];

export interface ApiKeyAllowListItem {
  method: string;
  resource: string;
}
