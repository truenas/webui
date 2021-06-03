import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface ApiKey {
  created_at: ApiTimestamp;
  id: number;
  key: string;
  name: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export type UpdateApiKeyRequest = [number, {
  name: string;
  reset?: boolean;
}];
