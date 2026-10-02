import { CallResponse } from '@truenas/api-client';
import {
  DirectoryServiceType,
} from 'app/enums/directory-services.enum';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';
import { DirectoryServiceCredential } from 'app/interfaces/directoryservice-credentials.interface';
import { IpaConfig } from 'app/interfaces/ipa-config.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

/**
 * Reads `directoryservices.config` into the shape the directory services forms are written
 * against. The generated entry spells every discriminant (`service_type`, `credential_type`,
 * `idmap_backend`, `schema`) as the wire literal where the forms switch on the UI's enums, and
 * leaves the fields middleware defaults optional; it describes the same object.
 */
export function toDirectoryServicesConfig(
  config: CallResponse<WebUiApiDirectory, 'directoryservices.config'>,
): DirectoryServicesConfig {
  return config as DirectoryServicesConfig;
}
