import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';

export interface SmbShare {
  aapl_name_mangling: boolean;
  abe: boolean;
  acl: boolean;
  browsable: boolean;
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
  options: SmbShareOptions;
}

export enum SmbPresetType {
  DefaultShare = 'DEFAULT_SHARE',
  LegacyShare = 'LEGACY_SHARE',
  TimeMachineShare = 'TIMEMACHINE_SHARE',
  MultiProtocolShare = 'MULTIPROTOCOL_SHARE',
  TimeLockedShare = 'TIME_LOCKED_SHARE',
  PrivateDatasetsShare = 'PRIVATE_DATASETS_SHARE',
  ExternalShare = 'EXTERNAL_SHARE',
}

export const externalSmbSharePath = 'EXTERNAL';

export const smbPresetTypeLabels = new Map<SmbPresetType, string>([
  [SmbPresetType.DefaultShare, T('Default Share')],
  [SmbPresetType.LegacyShare, T('Legacy Share')],
  [SmbPresetType.TimeMachineShare, T('Time Machine Share')],
  [SmbPresetType.MultiProtocolShare, T('Multi-Protocol Share')],
  [SmbPresetType.TimeLockedShare, T('Time Locked Share')],
  [SmbPresetType.PrivateDatasetsShare, T('Private Datasets Share')],
  [SmbPresetType.ExternalShare, T('External Share')],
]);

export const smbPresetTooltips = new Map<SmbPresetType, string>([
  [SmbPresetType.DefaultShare, T('Set the SMB share for best compatibility with common SMB clients.')],
  [SmbPresetType.LegacyShare, T('Legacy share type for compatibility with older TrueNAS versions. Please select a new share purpose.')],
  [SmbPresetType.TimeMachineShare, T('The SMB share is presented to MacOS clients as a time machine target. NOTE: aapl_extensions must be set in the global smb.config')],
  [SmbPresetType.MultiProtocolShare, T('The SMB share is configured for multi-protocol access. Set this if the path is shared through NFS, FTP, or used by containers or apps. NOTE: This setting can reduce SMB share performance because it turns off some SMB features for safer interoperability with external processes.')],
  [SmbPresetType.TimeLockedShare, T('The SMB share makes files read-only through the SMB protocol after the set graceperiod ends. WARNING: This setting does not work if the path is accessed locally or if another SMB share without the TIMELOCKED_SHARE purpose uses the same path. WARNING: This setting might not meet regulatory requirements for write-once storage.')],
  [SmbPresetType.PrivateDatasetsShare, T('The server uses the specified dataset_naming_schema in options to make a new ZFS dataset when the client connects. The server uses this dataset as the share path during the SMB session.')],
  [SmbPresetType.ExternalShare, T('The SMB share is a DFS proxy to a share hosted on an external SMB server.')],
]);

export interface LegacySmbShareOptions {
  purpose: SmbPresetType.LegacyShare;
  recyclebin?: boolean;
  path_suffix?: string;
  hostsallow?: string[];
  hostsdeny?: string[];
  guestok?: boolean;
  streams?: boolean;
  durablehandle?: boolean;
  shadowcopy?: boolean;
  fsrvp?: boolean;
  home?: boolean;
  acl?: boolean;
  afp?: boolean;
  timemachine?: boolean;
  timemachine_quota?: number;
  aapl_name_mangling?: boolean;
  auxsmbconf?: string;
  vuid?: string;
}

export interface DefaultSmbShareOptions {
  purpose: SmbPresetType.DefaultShare;
  aapl_name_mangling?: boolean;
}

export interface TimeMachineSmbShareOptions {
  purpose: SmbPresetType.TimeMachineShare;
  timemachine_quota?: number;
  vuid?: string;
  auto_snapshot?: boolean;
  auto_dataset_creation?: boolean;
  dataset_naming_schema?: string | null;
}

export interface MultiProtocolSmbShareOptions {
  purpose: SmbPresetType.MultiProtocolShare;
  aapl_name_mangling?: boolean;
}

export interface TimeLockedSmbShareOptions {
  purpose: SmbPresetType.TimeLockedShare;
  grace_period?: number;
  aapl_name_mangling?: boolean;
}

export interface PrivateDatasetsSmbShareOptions {
  purpose: SmbPresetType.PrivateDatasetsShare;
  dataset_naming_schema?: string | null;
  auto_quota?: number;
  aapl_name_mangling?: boolean;
}

export interface ExternalSmbShareOptions {
  purpose: SmbPresetType.ExternalShare;
  remote_path?: string[];
}

export type SmbShareOptions =
  | LegacySmbShareOptions
  | DefaultSmbShareOptions
  | TimeMachineSmbShareOptions
  | MultiProtocolSmbShareOptions
  | TimeLockedSmbShareOptions
  | PrivateDatasetsSmbShareOptions
  | ExternalSmbShareOptions;

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
    id_type: NfsAclTag.Everyone | NfsAclTag.UserGroup | NfsAclTag.User | null;
    id: number;
  };
  ae_who_sid?: string;
  ae_who_str?: NfsAclTag.Everyone | number | null;
}
