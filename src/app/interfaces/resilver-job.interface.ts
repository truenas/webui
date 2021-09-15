import { PoolScan } from 'app/interfaces/pool.interface';

export interface ResilverData {
  name: string;
  scan: PoolScan;
}

export interface ResilverJob {
  collection: string;
  fields: ResilverData;
  msg: string;
}
