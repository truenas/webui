import { Overwrite } from 'utility-types';
import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';

export type ActiveDirectoryConfigUi = Overwrite<ActiveDirectoryConfig, {
  netbiosalias: string;
  kerberos_realm?: string;
}>;
