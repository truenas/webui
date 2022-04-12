import { AclMode } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  DatasetChecksum, DatasetRecordSize, DatasetShareType,
  DatasetSnapdir,
  DatasetSync,
  DatasetType,
  DatasetVolumeBlockSize, DatasetXattr,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface Dataset {
  available: ZfsProperty<number>;
  compression: ZfsProperty<string>;
  compressratio: ZfsProperty<string>;
  deduplication: ZfsProperty<string>;
  encrypted: boolean;
  encryption_algorithm: ZfsProperty<string>;
  encryption_root: unknown;
  id: string;
  key_format: ZfsProperty<string>;
  key_loaded: boolean;
  locked: boolean;
  mountpoint: string;
  name: string;
  pool: string;
  readonly: ZfsProperty<boolean>;
  used: ZfsProperty<number>;
  type: DatasetType;
  managedby: ZfsProperty<string>;
  aclmode: ZfsProperty<string>;
  acltype: ZfsProperty<string>;
  atime: ZfsProperty<boolean>;
  casesensitivity: ZfsProperty<DatasetCaseSensitivity>;
  copies: ZfsProperty<number>;
  exec: ZfsProperty<boolean>;
  origin: ZfsProperty<string>;
  pbkdf2iters: ZfsProperty<string>;
  quota: ZfsProperty<number>;
  recordsize: ZfsProperty<number>;
  refquota: ZfsProperty<number>;
  refreservation: ZfsProperty<number>;
  reservation: ZfsProperty<number>;
  snapdir: ZfsProperty<number>;
  share_type: ZfsProperty<string>;
  special_small_block_size: ZfsProperty<string>;
  sync: ZfsProperty<string>;
  xattr: ZfsProperty<boolean>;

  // Absent if extra.retrieve_children is false
  children?: Dataset[];

  // TODO: Need to confirm that these properties are valid backend properties
  refquota_critical?: ZfsProperty<number>;
  refquota_warning?: ZfsProperty<number>;
  quota_critical?: ZfsProperty<number>;
  quota_warning?: ZfsProperty<number>;
  comments?: ZfsProperty<string>;

  // Present for type === DatasetType.Volume
  volsize?: ZfsProperty<number>;
  volblocksize?: ZfsProperty<number>;
}

export interface ExtraDatasetQueryOptions {
  extra: {
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
  sync?: DatasetSync;
  compression?: string;
  atime?: OnOff;
  exec?: OnOff;
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
  snapdir?: DatasetSnapdir;
  deduplication?: string;
  checksum?: DatasetChecksum;
  readonly?: WithInherit<OnOff>;
  recordsize?: WithInherit<string>;
  casesensitivity?: DatasetCaseSensitivity;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  share_type?: DatasetShareType;
  xattr?: DatasetXattr;
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
  sync?: DatasetSync;
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
  special_small_block_size?: number;
  copies?: WithInherit<number>;
  snapdir?: DatasetSnapdir;
  deduplication?: DeduplicationSetting;
  checksum?: WithInherit<DatasetChecksum>;
  readonly?: WithInherit<OnOff>;
  recordsize?: WithInherit<DatasetRecordSize>;
  aclmode?: AclMode;
  acltype?: DatasetAclType;
  xattr?: DatasetXattr;
  user_properties?: Record<string, string>;
  create_ancestors?: boolean;
  user_properties_update?: { key: string; value: string; remove?: boolean }[];
}
