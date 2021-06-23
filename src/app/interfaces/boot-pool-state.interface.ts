import { PoolScan, PoolTopology } from 'app/interfaces/pool.interface';

export interface BootPoolState {
  error_count: number;
  features: any[];
  groups: PoolTopology;
  guid: string;
  healthy: true;
  hostname: string;
  id: string;
  name: string;
  properties: any;
  root_dataset: any;
  root_vdev: any;
  scan: PoolScan;
  status: string; // ONLINE
  status_code: string; // FEAT_DISABLED
  status_detail: string;
}
