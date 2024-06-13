import { CredentialType, Credentials } from 'app/interfaces/credential-type.interface';

export function getCredentialsCreationSource(credentials: Credentials): string {
  if (credentials.type in [CredentialType.UnixSocket, CredentialType.LoginPassword, CredentialType.Token]) {
    return credentials.data.username;
  }
  if (credentials.type === CredentialType.ApiKey) {
    return credentials.data.api_key;
  }
  return '';
}
