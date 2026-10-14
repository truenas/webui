import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

/**
 * Reads an `auth.sessions` row. `created_at` arrives as a `{ $date }` envelope, typed as a string (gap 15), and
 * middleware spells `credentials` as a literal and declares `credentials_data` as one model per credential type.
 */
export function toAuthSession(session: WebUiQueryEntity<'auth.sessions'>): AuthSession {
  return session as unknown as AuthSession;
}
