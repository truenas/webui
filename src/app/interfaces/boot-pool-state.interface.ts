import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolScanUpdate, PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface BootPoolState {
  error_count: number;
  features: BootPoolFeatureItem[];
  groups: PoolTopology;
  guid: string;
  healthy: true;
  hostname: string;
  id: string;
  name: string;
  properties: {
    [property: string]: ZfsProperty<unknown>;
    allocated: ZfsProperty<number>;
    size: ZfsProperty<number>;
    health: ZfsProperty<PoolStatus>;
  };
  root_dataset: BootPoolRootDataset;
  root_vdev: VDev;
  scan: PoolScanUpdate;
  status: string; // ONLINE
  status_code: string; // FEAT_DISABLED
  status_detail: string;
}

export interface BootPoolRootDataset {
  id: string;
  name: string;
  pool: string;
  type: string;
  properties: unknown;
  mountpoint: string;
  encrypted: boolean;
  encryption_root: string;
  key_loaded: boolean;
}

export interface BootPoolFeatureItem {
  name: string;
  guid: string;
  description: string;
  state: string;
}
