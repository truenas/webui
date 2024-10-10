import { AclMode } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  DatasetChecksum,
  DatasetPreset,
  DatasetRecordSize,
  DatasetSnapdev,
  DatasetSnapdir,
  DatasetSync,
  DatasetType,
  DatasetVolumeBlockSize,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface Dataset {
  available: ZfsProperty<string, number>;
  compression: ZfsProperty<string, string>;
  compressratio: ZfsProperty<string, string>;
  deduplication: ZfsProperty<DeduplicationSetting, string>;
  encrypted: boolean;
  encryption_algorithm: ZfsProperty<string>;
  encryption_root: string;
  id: string;
  key_format: ZfsProperty<EncryptionKeyFormat>;
  key_loaded: boolean;
  locked: boolean;
  mountpoint: string;
  name: string;
  pool: string;
  readonly: ZfsProperty<OnOff, boolean>;
  used: ZfsProperty<string, number>;
  usedbychildren: ZfsProperty<string, number>;
  usedbydataset: ZfsProperty<string, number>;
  usedbyrefreservation: ZfsProperty<string, number>;
  usedbysnapshots: ZfsProperty<string, number>;
  type: DatasetType;
  managedby: ZfsProperty<string, string>;
  aclmode: ZfsProperty<AclMode, string>;
  acltype: ZfsProperty<DatasetAclType, string>;
  atime: ZfsProperty<OnOff, boolean>;
  casesensitivity: ZfsProperty<DatasetCaseSensitivity, string>;
  copies: ZfsProperty<string, number>;
  exec: ZfsProperty<OnOff, boolean>;
  origin: ZfsProperty<string>;
  pbkdf2iters: ZfsProperty<string, string>;
  quota: ZfsProperty<number>;
  recordsize: ZfsProperty<string, number>;
  refquota: ZfsProperty<number>;
  refreservation: ZfsProperty<number>;
  reservation: ZfsProperty<string, number>;
  snapdev: ZfsProperty<DatasetSnapdev, string>;
  snapdir: ZfsProperty<DatasetSnapdir, string>;
  share_type: ZfsProperty<DatasetPreset, string>;
  special_small_block_size: ZfsProperty<string>;
  sync: ZfsProperty<DatasetSync, string>;
  checksum: ZfsProperty<DatasetChecksum>;

  // Absent if extra.retrieve_children is false
  children?: Dataset[];

  refquota_critical?: ZfsProperty<string, string>;
  refquota_warning?: ZfsProperty<string, string>;
  quota_critical?: ZfsProperty<string, string>;
  quota_warning?: ZfsProperty<string, string>;
  comments?: ZfsProperty<string>;

  // Present for type === DatasetType.Volume
  volsize?: ZfsProperty<string, number>;
  volblocksize?: ZfsProperty<string, number>;
}

export interface ExtraDatasetQueryOptions {
  extra?: {
    retrieve_children?: boolean;
    flat?: boolean;
    properties?: string[];
  };
}

export interface DatasetCreate {
  name: string;
  type?: DatasetType;
  volsize?: number;
  volblocksize?: DatasetVolumeBlockSize;
  sparse?: boolean;
  force_size?: boolean;
  comments?: string;
  sync?: WithInherit<DatasetSync>;
  compression?: string;
  atime?: OnOff;
  exec?: WithInherit<OnOff>;
  managedby?: string;
  quota?: number;
  quota_warning?: WithInherit<number>;
  quota_critical?: WithInherit<number>;
  refquota?: WithInherit<number>;
  refquota_warning?: WithInherit<number>;
  refquota_critical?: WithInherit<number>;
  reservation?: number;
  refreservation?: number;
  special_small_block_size?: WithInherit<number>;
  copies?: WithInherit<number>;
  snapdir?: WithInherit<DatasetSnapdir>;
  snapdev?: WithInherit<DatasetSnapdev>;
  deduplication?: string;
  checksum?: DatasetChecksum;
  readonly?: WithInherit<OnOff>;
  recordsize?: WithInherit<string>;
  casesensitivity?: DatasetCaseSensitivity;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  share_type?: DatasetPreset;
  encryption_options?: {
    generate_key?: boolean;
    pbkdf2iters?: number;
    algorithm?: string;
    passphrase?: string;
    key?: string;
  };
  encryption?: boolean;
  inherit_encryption?: boolean;
  user_properties?: { key: string; value: string }[];
  create_ancestors?: boolean;
}

export interface DatasetUpdate {
  volsize?: number;
  force_size?: boolean;
  comments?: WithInherit<string>;
  sync?: WithInherit<DatasetSync>;
  compression?: WithInherit<string>;
  atime?: WithInherit<OnOff>;
  exec?: WithInherit<OnOff>;
  managedby?: WithInherit<string>;
  quota?: number;
  quota_warning?: WithInherit<number>;
  quota_critical?: WithInherit<number>;
  refquota?: WithInherit<number>;
  refquota_warning?: WithInherit<number>;
  refquota_critical?: WithInherit<number>;
  reservation?: number;
  refreservation?: number;
  special_small_block_size?: WithInherit<number>;
  copies?: WithInherit<number>;
  snapdir?: DatasetSnapdir;
  snapdev?: DatasetSnapdev;
  deduplication?: DeduplicationSetting;
  checksum?: WithInherit<DatasetChecksum>;
  readonly?: WithInherit<OnOff>;
  recordsize?: WithInherit<DatasetRecordSize>;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  user_properties?: Record<string, string>;
  create_ancestors?: boolean;
  user_properties_update?: { key: string; value: string; remove?: boolean }[];
}

export interface DatasetDetails {
  id: string;
  encrypted: boolean;
  available: ZfsProperty<string, number>;
  encryption_algorithm: ZfsProperty<string>;
  encryption_root: string;
  key_format: ZfsProperty<EncryptionKeyFormat>;
  key_loaded: boolean;
  locked: boolean;
  readonly: boolean;
  mountpoint: string;
  name: string;
  pool: string;
  type: DatasetType;
  used: ZfsProperty<string, number>;
  usedbychildren: ZfsProperty<string, number>;
  usedbydataset: ZfsProperty<string, number>;
  usedbysnapshots: ZfsProperty<string, number>;
  quota: ZfsProperty<string, number>;
  refquota: ZfsProperty<string, number>;
  refreservation: ZfsProperty<string, number>;
  reservation: ZfsProperty<string, number>;
  snapshot_count?: number;
  replication_tasks_count?: number;
  snapshot_tasks_count?: number;
  cloudsync_tasks_count?: number;
  rsync_tasks_count?: number;
  smb_shares?: { enabled: boolean; path: string; share_name: string }[];
  nfs_shares?: { enabled: boolean; path: string }[];
  iscsi_shares?: { enabled: boolean; type: IscsiExtentType; path: string }[];
  vms?: { name: string; path: string }[];
  apps?: { name: string; path: string }[];
  children?: DatasetDetails[];
  volsize?: ZfsProperty<string, number>; // Present for type === DatasetType.Volume
  thick_provisioned?: boolean; // Present for type === DatasetType.Volume
  atime: boolean;
  casesensitive: boolean;
  origin: ZfsProperty<string>;
  sync: ZfsProperty<string>;
  compression: ZfsProperty<string>;
  deduplication: ZfsProperty<string>;
  refquota_critical?: ZfsProperty<string, number>;
  refquota_warning?: ZfsProperty<string, number>;
  quota_critical?: ZfsProperty<string, number>;
  quota_warning?: ZfsProperty<string, number>;
  comments?: ZfsProperty<string>;
}

export enum DiskSpaceKey {
  UsedByDataset = 'usedbydataset',
  UsedByChildren = 'usedbychildren',
}
export type DiskSpace = { [key in DiskSpaceKey]?: number };
export type SwatchColors = { [key in DiskSpaceKey]?: { backgroundColor: string } };
