import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface AuthSession extends AuthSessionCredentialsData {
  id: string;
  current: boolean;
  internal: boolean;
  origin: string;
  created_at: ApiTimestamp;
}

export interface AuthSessionCredentialsData {
  credentials: string;
  credentials_data: {
    username?: string;
    parent?: AuthSessionCredentialsData;
  };
}
