import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum CredentialType {
  TwoFactor = 'LOGIN_TWOFACTOR',
  UnixSocket = 'UNIX_SOCKET',
  RootTcpSocket = 'ROOT_TCP_SOCKET',
  LoginPassword = 'LOGIN_PASSWORD',
  ApiKey = 'API_KEY',
  Token = 'TOKEN',
}

export interface Credentials {
  type?: CredentialType;
  data?: {
    username?: string;
    api_key?: string;
    parent?: Credentials;
  };
}

export const credentialTypeLabels = new Map<CredentialType, string>([
  [CredentialType.TwoFactor, T('Two-Factor Authentication')],
  [CredentialType.UnixSocket, T('Unix Socket')],
  [CredentialType.RootTcpSocket, T('Root TCP Socket')],
  [CredentialType.LoginPassword, T('Password Login')],
  [CredentialType.ApiKey, T('API Key')],
  [CredentialType.Token, T('Token')],
]);
