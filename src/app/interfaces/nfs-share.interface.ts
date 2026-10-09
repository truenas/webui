import { NfsSecurityProvider } from 'app/enums/nfs-security-provider.enum';
import { SharingTierInfo } from 'app/interfaces/zfs-tier.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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
  tier?: SharingTierInfo | null;
}

/**
 * Reads a `sharing.nfs.query` row into the shape the NFS pages are written against. The generated entry
 * spells `security` and the tier as wire literals and leaves the fields middleware defaults optional;
 * it describes the same object.
 *
 * The cast checks nothing, so a regenerated entry that drops or renames a field still compiles and
 * reads `undefined`.
 */
export function toNfsShare(share: WebUiQueryEntity<'sharing.nfs.query'>): NfsShare {
  return share as unknown as NfsShare;
}

export interface Nfs3Session {
  ip: string;
  export: string;
}

export interface Nfs4Session {
  id: number;
  info: Nfs4Info;
  states: Nfs4State[];
}

/**
 * Reads a `nfs.get_nfs4_clients` row. Middleware declares `info` as a loose record; the session list
 * reads the fields of `/proc/fs/nfsd/clients/<id>/info` it names here.
 */
export function toNfs4Session(session: WebUiQueryEntity<'nfs.get_nfs4_clients'>): Nfs4Session {
  return session as unknown as Nfs4Session;
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
