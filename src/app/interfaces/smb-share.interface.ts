import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { SmbSharesecPermission, SmbSharesecType } from 'app/enums/smb-sharesec.enum';

export interface BaseShare {
  id: number;
  purpose?: SmbSharePurpose;
  name: string;
  path: string;
  enabled?: boolean;
  comment?: string;
  readonly?: boolean;
  browsable?: boolean;
  access_based_share_enumeration?: boolean;
  locked: boolean;
  audit?: {
    enable?: boolean;
    watch_list?: string[];
    ignore_list?: string[];
  };
}

export type SmbShare =
  | DefaultSmbShare
  | LegacySmbShare
  | TimeMachineSmbShare
  | MultiProtocolSmbShare
  | TimeLockedSmbShare
  | PrivateDatasetsSmbShare
  | ExternalSmbShare
  | VeeamRepositorySmbShare;

export enum SmbSharePurpose {
  DefaultShare = 'DEFAULT_SHARE',
  LegacyShare = 'LEGACY_SHARE',
  TimeMachineShare = 'TIMEMACHINE_SHARE',
  MultiProtocolShare = 'MULTIPROTOCOL_SHARE',
  TimeLockedShare = 'TIME_LOCKED_SHARE',
  PrivateDatasetsShare = 'PRIVATE_DATASETS_SHARE',
  ExternalShare = 'EXTERNAL_SHARE',
  VeeamRepositoryShare = 'VEEAM_REPOSITORY_SHARE',
}

export const externalSmbSharePath = 'EXTERNAL';

export const smbSharePurposeLabels = new Map<SmbSharePurpose, string>([
  [SmbSharePurpose.DefaultShare, T('Default Share')],
  [SmbSharePurpose.LegacyShare, T('Legacy Share')],
  [SmbSharePurpose.TimeMachineShare, T('Time Machine Share')],
  [SmbSharePurpose.MultiProtocolShare, T('Multi-Protocol Share')],
  [SmbSharePurpose.TimeLockedShare, T('Time Locked Share')],
  [SmbSharePurpose.PrivateDatasetsShare, T('Private Datasets Share')],
  [SmbSharePurpose.ExternalShare, T('External Share')],
  [SmbSharePurpose.VeeamRepositoryShare, T('Veeam Repository Share')],
]);

export const smbSharePurposeTooltips = new Map<SmbSharePurpose, string>([
  [SmbSharePurpose.DefaultShare, T('Set the SMB share for best compatibility with common SMB clients.')],
  [SmbSharePurpose.LegacyShare, T('Legacy share type for compatibility with older TrueNAS versions. Please select a new share purpose.')],
  [SmbSharePurpose.TimeMachineShare, T('The SMB share is presented to MacOS clients as a time machine target.')],
  [SmbSharePurpose.MultiProtocolShare, T('The SMB share is configured for multi-protocol access. Set this if the path is shared through NFS, FTP, or used by containers or apps. NOTE: This setting can reduce SMB share performance because it turns off some SMB features for safer interoperability with external processes.')],
  [SmbSharePurpose.TimeLockedShare, T('The SMB share makes files read-only through the SMB protocol after the set graceperiod ends. WARNING: This setting does not work if the path is accessed locally or if another SMB share without the TIMELOCKED_SHARE purpose uses the same path. WARNING: This setting might not meet regulatory requirements for write-once storage.')],
  [SmbSharePurpose.PrivateDatasetsShare, T('The server uses the specified dataset_naming_schema in options to make a new ZFS dataset when the client connects. The server uses this dataset as the share path during the SMB session.')],
  [SmbSharePurpose.ExternalShare, T('The SMB share is a DFS proxy to a share hosted on an external SMB server.')],
  [SmbSharePurpose.VeeamRepositoryShare, T('The SMB share is a repository for Veeam Backup & Replication and supports Fast Clone.')],
]);

export interface DefaultSmbShare extends BaseShare {
  purpose: SmbSharePurpose.DefaultShare;
  options: DefaultSmbShareOptions;
}

export interface LegacySmbShare extends BaseShare {
  purpose: SmbSharePurpose.LegacyShare;
  options: LegacySmbShareOptions;
}

export interface TimeMachineSmbShare extends BaseShare {
  purpose: SmbSharePurpose.TimeMachineShare;
  options: TimeMachineSmbShareOptions;
}

export interface MultiProtocolSmbShare extends BaseShare {
  purpose: SmbSharePurpose.MultiProtocolShare;
  options: MultiProtocolSmbShareOptions;
}

export interface TimeLockedSmbShare extends BaseShare {
  purpose: SmbSharePurpose.TimeLockedShare;
  options: TimeLockedSmbShareOptions;
}

export interface PrivateDatasetsSmbShare extends BaseShare {
  purpose: SmbSharePurpose.PrivateDatasetsShare;
  options: PrivateDatasetsSmbShareOptions;
}

export interface ExternalSmbShare extends BaseShare {
  purpose: SmbSharePurpose.ExternalShare;
  options: ExternalSmbShareOptions;
}

export interface VeeamRepositorySmbShare extends BaseShare {
  purpose: SmbSharePurpose.VeeamRepositoryShare;
  options: Record<string, never>;
}

export type SmbShareOptions =
  | DefaultSmbShareOptions
  | LegacySmbShareOptions
  | TimeMachineSmbShareOptions
  | MultiProtocolSmbShareOptions
  | TimeLockedSmbShareOptions
  | PrivateDatasetsSmbShareOptions
  | ExternalSmbShareOptions;

export interface LegacySmbShareOptions {
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
  aapl_name_mangling?: boolean;
}

export interface TimeMachineSmbShareOptions {
  timemachine_quota?: number;
  vuid?: string;
  auto_snapshot?: boolean;
  auto_dataset_creation?: boolean;
  dataset_naming_schema?: string | null;
}

export interface MultiProtocolSmbShareOptions {
  aapl_name_mangling?: boolean;
}

export interface TimeLockedSmbShareOptions {
  grace_period?: number;
  aapl_name_mangling?: boolean;
}

export interface PrivateDatasetsSmbShareOptions {
  dataset_naming_schema?: string | null;
  auto_quota?: number;
  aapl_name_mangling?: boolean;
}

export interface ExternalSmbShareOptions {
  remote_path?: string[];
}

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
