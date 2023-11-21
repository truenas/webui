import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';

export interface AuthSession extends AuthSessionCredentialsData {
  id: string;
  current: boolean;
  internal: boolean;
  origin: string;
  created_at: ApiTimestamp;
}

export interface AuthSessionCredentialsData {
  credentials: CredentialType;
  credentials_data: {
    username?: string;
    parent?: AuthSessionCredentialsData;
  };
}
