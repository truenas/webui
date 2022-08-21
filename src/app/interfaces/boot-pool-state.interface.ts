import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolScanUpdate } from 'app/interfaces/pool.interface';
import { TopologyItemStats } from 'app/interfaces/storage.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { PoolTopology } from './pool.interface';

export interface BootPoolState {
  error_count: number;
  features: BootPoolFeatureItem[];
  guid: string;
  healthy: true;
  hostname: string;
  id: string;
  name: string;
  path: string;
  properties: {
    [property: string]: ZfsProperty<unknown>;
    allocated: ZfsProperty<number>;
    size: ZfsProperty<number>;
    health: ZfsProperty<PoolStatus>;
  };
  root_dataset: BootPoolRootDataset;
  root_vdev: BootPoolTopologyItem;
  scan: PoolScanUpdate;
  status: PoolStatus;
  status_code: string; // FEAT_DISABLED
  status_detail: string;
  topology: PoolTopology;
  warning: boolean;
  size: number;
  free: number;
  freeing: number;

}

// This is very similar to a TopologyItem, but middleware returns lowercase `type` for some reason.
export interface BootPoolTopologyItem {
  children: BootPoolTopologyItem[];
  guid: string;
  name: string;
  path: string;
  stats: TopologyItemStats;
  status: TopologyItemStatus;
  type: string;
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
