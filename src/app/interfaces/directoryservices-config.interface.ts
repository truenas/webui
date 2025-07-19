import {
  DirectoryServiceType,
} from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';

export interface DirectoryServicesConfig {
  id: number;
  service_type: DirectoryServiceType | null;
  credential: DirectoryServiceCredential | null;
  enable: boolean;
  enable_account_cache: boolean;
  enable_dns_updates: boolean;
  timeout: number;
  kerberos_realm: string | null;
  configuration: ActiveDirectoryConfig | IpaConfig | LdapConfig | null;
}
