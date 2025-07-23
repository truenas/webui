import { DirectoryServiceCredentialType } from 'app/enums/directory-services.enum';

export interface CredentialKerberosUser {
  credential_type: DirectoryServiceCredentialType.KerberosUser;
  username: string;
  password: string;
}

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
