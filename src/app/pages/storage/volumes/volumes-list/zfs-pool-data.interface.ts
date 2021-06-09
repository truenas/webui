import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { VolumesListTableConfig } from 'app/pages/storage/volumes/volumes-list/volumes-list-table-config';

export interface ZfsPoolData {
  pool: string;
  available: ZfsProperty<number>;
  available_parsed?: string;
  availStr?: string;
  id?: string;
  is_decrypted?: boolean;
  is_upgraded?: boolean;
  mountpoint?: string;
  name?: string;
  path?: string;
  nodePath?: string;
  parentPath?: string;
  status?: string;
  used?: ZfsProperty<number>;
  used_parsed?: string;
  used_pct?: string;
  usedStr?: string;
  sed_pct?: string;
  vol_encrypt?: number;
  vol_encryptkey?: string;
  vol_guid?: string;
  vol_name?: string;
  type?: string;
  compression?: string;
  dedup?: string;
  readonly?: string;
  children?: any[];
  dataset_data?: any;
  actions?: any[];
  comments?: string;
  compressionRatio?: any;
  volumesListTableConfig?: VolumesListTableConfig;
}
