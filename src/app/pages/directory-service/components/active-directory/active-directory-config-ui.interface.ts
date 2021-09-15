import { ActiveDirectoryConfig } from 'app/interfaces/active-directory-config.interface';

export type ActiveDirectoryConfigUi = {
  netbiosalias: string;
  kerberos_realm?: string;
} & Omit<ActiveDirectoryConfig, 'netbiosalias' | 'kerberos_realm'>;
