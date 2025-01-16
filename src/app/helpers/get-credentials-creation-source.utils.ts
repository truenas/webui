import { CredentialType, Credentials } from 'app/interfaces/credential-type.interface';

export function getCredentialsCreationSource(credentials: Credentials | null): string {
  if (!credentials?.type) {
    return '';
  }

  if ([CredentialType.UnixSocket, CredentialType.LoginPassword, CredentialType.Token].includes(credentials.type)) {
    return credentials.data?.username || '';
  }
  if (credentials.type === CredentialType.ApiKey) {
    return credentials.data?.api_key || '';
  }
  return '';
}
