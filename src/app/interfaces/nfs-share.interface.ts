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
  expose_snapshots?: boolean;
  security: NfsSecurityProvider[];
}

export type NfsShareUpdate = Partial<Omit<NfsShare, 'id' | 'locked'>>;

export interface Nfs3Session {
  ip: string;
  export: string;
}

export interface Nfs4Session {
  id: number;
  info: Nfs4Info;
  states: Nfs4State[];
}

export enum NfsType {
  Nfs3 = 'nfs3',
  Nfs4 = 'nfs4',
}

interface Nfs4Info {
  clientid: number;
  address: string;
  status: string;
  name: string;
  'seconds from last renew': number;
  'minor version': number;
  'Implementation domain': string;
  'Implementation name': string;
  'Implementation time': number[];
  'callback state': string;
  'callback address': string;
}

type Nfs4State = Record<string, {
  type: string;
  access: string;
  deny: string;
  superblock: string;
  filename: string;
  owner: string;
}>;
