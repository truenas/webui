import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ApiKey {
  created_at: ApiTimestamp;
  id: number;
  key: string;
  name: string;
}

export interface CreateApiKeyRequest {
  name: string;
  allowlist: ApiKeyAllowListItem[];
}

export type UpdateApiKeyRequest = [number, {
  name: string;
  reset?: boolean;
}];

export interface ApiKeyAllowListItem {
  method: string;
  resource: string;
}
