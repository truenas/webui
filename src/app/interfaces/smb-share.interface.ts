import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';

export interface SmbShare {
  aapl_name_mangling: boolean;
  abe: boolean;
  acl: boolean;
  browsable: boolean;
  cluster_volname: string;
  comment: string;
  durablehandle: boolean;
  enabled: boolean;
  fsrvp: boolean;
  guestok: boolean;
  home: boolean;
  hostsallow: string[];
  hostsdeny: string[];
  id: number;
  locked: boolean;
  name: string;
  path: string;
  path_suffix: string;
  auxsmbconf: string;
  purpose: SmbPresetType;
  recyclebin: boolean;
  ro: boolean;
  shadowcopy: boolean;
  streams: boolean;
  timemachine: boolean;
  vuid: string;
  path_local: string;
  audit: {
    enable?: boolean;
    watch_list?: string[];
    ignore_list?: string[];
  };
}

export enum SmbPresetType {
  NoPresets = 'NO_PRESET',
  DefaultShareParameters = 'DEFAULT_SHARE',
  MultiUserTimeMachine = 'ENHANCED_TIMEMACHINE',
  MultiProtocolShares = 'MULTI_PROTOCOL_NFS',
  PrivateSmbDatasets = 'PRIVATE_DATASETS',
  SmbWorm = 'WORM_DROPBOX',
}

export interface SmbPreset {
  cluster: boolean;
  verbose_name: string;
  params: Partial<SmbShare>;
}

export type SmbPresets = Record<string, SmbPreset>;

export interface SmbSharesec {
  id: number;
  share_acl: SmbSharesecAce[];
  share_name: string;
}

export interface SmbSharesecAce {
  ae_perm: SmbSharesecPermission;
  ae_type: SmbSharesecType;
  ae_who_id: {
    id_type: NfsAclTag.Everyone | NfsAclTag.UserGroup | NfsAclTag.User | NfsAclTag.Both | null;
    id: number;
  };
  ae_who_sid?: string;
  ae_who_str?: NfsAclTag.Everyone | number | null;
}

export type SmbShareUpdate = {
  timemachine_quota?: number;
} & Partial<Omit<SmbShare, 'id' | 'locked' | 'vuid'>>;
