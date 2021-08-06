import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';

export interface DirectoryServicesState {
  activedirectory: DirectoryServiceState;
  ldap: DirectoryServiceState;
}
