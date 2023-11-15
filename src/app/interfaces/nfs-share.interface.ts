import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';

export interface NfsShare {
  aliases: string[];
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
  path: string;
  quiet: boolean;
  ro: boolean;
  security: NfsSecurityProvider[];
}

export type NfsShareUpdate = Partial<Omit<NfsShare, 'id' | 'locked'>>;

export interface NfsSession {
  session_id: string;
  ip: string;
  server_id: {
    pid: string;
    task_id: string;
    vnn: string;
    unique_id: string;
  };
  uid: number;
  gid: number;
  username: string;
  groupname: string;
  remote_machine: string;
  hostname: string;
  session_dialect: string;
  encryption: {
    cipher: string;
    degree: string;
  };
  signing: {
    cipher: string;
    degree: string;
  };
}
