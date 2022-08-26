import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolTopologyCategory } from 'app/enums/pool-topology-category.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface Pool {
  autotrim: ZfsProperty<string>;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encrypt: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey: string;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey_path: string;
  guid: string;
  healthy: boolean;
  id: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  is_decrypted: boolean;
  name: string;
  path: string;
  scan: PoolScanUpdate;
  status: PoolStatus;
  status_detail: string;
  topology: PoolTopology;

  /**
   * Available with extra is_upgraded=true
   */
  is_upgraded?: boolean;
}

export type PoolTopology = {
  [category in PoolTopologyCategory]: TopologyItem[];
};

export interface PoolScanUpdate {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ApiTimestamp;
  errors: number;
  function: PoolScanFunction;
  pause: string;
  percentage: number;
  start_time: ApiTimestamp;
  state: PoolScanState;
  total_secs_left: number;
}

export interface CreatePool {
  encryption: boolean;
  encryption_options?: {
    generate_key: boolean;
    algorithm: string;
    passphrase?: string;
    key?: string;
  };
  name: string;
  topology: {
    [key in PoolTopologyCategory]: { type: string; disks: string[] }[];
  };
  checksum?: string;
  deduplication?: DeduplicationSetting;
  allow_duplicate_serials?: boolean;
}

export interface UpdatePool {
  topology?: {
    [key in PoolTopologyCategory]: { type: string; disks?: string[] }[];
  };
  autotrim?: OnOff;
  allow_duplicate_serials?: boolean;
}

export interface PoolAttachParams {
  target_vdev?: string;
  new_disk?: string;
  passphrase?: string;
  allow_duplicate_serials?: boolean;
}

export interface PoolReplaceParams {
  label: string;
  disk: string;
  force?: boolean;
  passphrase?: string;
  preserve_settings?: string;
}

export type PoolExpandParams = [
  id: number,
  params?: { geli: { passphrase: string } },
];

export type PoolInstanceParams = [
  name: string,
];

export interface PoolInstance {
  id: number;
  name: string;
  guid: string;
  encrypt: number;
  encryptkey: string;
  encryptkey_path: string;
  is_decrypted: boolean;
  status: PoolStatus;
  path: string;
  scan: PoolScanUpdate;
  is_upgraded: boolean;
  healthy: boolean;
  warning: boolean;
  status_detail: string;
  size: number;
  allocated: number;
  free: number;
  freeing: number;
  fragmentation: string;
  autotrim: ZfsProperty<string>;
  topology: PoolTopology;
}
