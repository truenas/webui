export interface CredentialWithUsernamePassword {
  credential_type: string;
  username: string;
  password: string;
}

export interface DirectoryServicesLeaveParams {
  credential: CredentialWithUsernamePassword;
}

export interface DirectoryServicesLeaveResponse {
  result: null;
}
