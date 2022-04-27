import { DatasetChecksum } from 'app/enums/dataset-checksum.enum';
import { DatasetType } from 'app/enums/dataset-type.enum';
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
  casesensitivity: ZfsProperty<string>;
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
  checksum: ZfsProperty<DatasetChecksum>;

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
