export interface CredentialKerberosUser {
  credential_type: 'KERBEROS_USER';
  username: string;
  password: string;
}

export interface DirectoryServicesLeaveParams {
  credential: CredentialKerberosUser;
}

export interface DirectoryServicesLeaveResponse {
  result: null;
}
