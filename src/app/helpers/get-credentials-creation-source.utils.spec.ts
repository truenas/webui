import { CredentialType, Credentials } from 'app/interfaces/credential-type.interface';
import { getCredentialsCreationSource } from './get-credentials-creation-source.utils';

describe('getCredentialsCreationSource', () => {
  it('returns empty string when credentials are null', () => {
    expect(getCredentialsCreationSource(null)).toBe('');
  });

  it('returns username for unix socket, login password and token types', () => {
    const creds = {
      type: CredentialType.LoginPassword,
      data: { username: 'root' },
    } as Credentials;

    expect(getCredentialsCreationSource(creds)).toBe('root');
  });

  it('returns username for ApiKey type', () => {
    const creds = {
      type: CredentialType.ApiKey,
      data: { username: 'admin' },
    } as Credentials;

    expect(getCredentialsCreationSource(creds)).toBe('admin');
  });

  it('returns empty string when data is missing', () => {
    const creds = {
      type: CredentialType.Token,
    } as Credentials;

    expect(getCredentialsCreationSource(creds)).toBe('');
  });
});
