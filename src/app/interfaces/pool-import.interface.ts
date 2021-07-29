import { PoolStatus } from 'app/enums/pool-status.enum';

export interface PoolFindResult {
  guid: string;
  hostname: string;
  name: string;
  status: PoolStatus;
}

export type PoolImportParams = [
  { guid: string },
];
