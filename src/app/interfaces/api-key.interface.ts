import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ApiKey {
  created_at: ApiTimestamp;
  expires_at: ApiTimestamp;
  id: number;
  key: string;
  keyhash: string;
  local: boolean;
  revoked: boolean;
  name: string;
  username: string;
  user_identifier: number;
}

export interface CreateApiKeyRequest {
  name: string;
  username: string;
  expires_at?: ApiTimestamp;
}

export type UpdateApiKeyRequest = [number, {
  name: string;
  reset?: boolean;
  expires_at?: ApiTimestamp;
}];
