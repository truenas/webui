import { PoolScan, PoolTopology } from 'app/interfaces/pool.interface';
import { VDev } from 'app/interfaces/storage.interface';

export interface BootPoolState {
  error_count: number;
  features: BootPoolFeatureItem[];
  groups: PoolTopology;
  guid: string;
  healthy: true;
  hostname: string;
  id: string;
  name: string;
  properties: any;
  root_dataset: any;
  root_vdev: VDev;
  scan: PoolScan;
  status: string; // ONLINE
  status_code: string; // FEAT_DISABLED
  status_detail: string;
}

export interface BootPoolFeatureItem {
  name: string;
  guid: string;
  description: string;
  state: string;
}
