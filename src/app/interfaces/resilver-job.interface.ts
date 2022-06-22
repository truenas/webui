import { PoolScanUpdate } from 'app/interfaces/pool.interface';

export interface PoolScan {
  name: string;
  scan: PoolScanUpdate;
}

export interface ResilverJob {
  collection: string;
  fields: PoolScan;
  msg: string;
}
