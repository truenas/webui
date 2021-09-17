import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';

export interface NfsShare {
  aliases: string[];
  alldirs: boolean;
  comment: string;
  enabled: boolean;
  hosts: string[];
  id: number;
  locked: boolean;
  mapall_group: string;
  mapall_user: string;
  maproot_group: string;
  maproot_user: string;
  networks: string[];
  paths: string[];
  quiet: boolean;
  ro: boolean;
  security: NfsSecurityProvider[];
}

export type NfsShareUpdate = Omit<NfsShare, 'id' | 'locked'>;
