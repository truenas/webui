import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolScanUpdate, PoolTopology } from 'app/interfaces/pool.interface';

export interface ZpoolProperty {
  raw: string;
  source: string | null;
  value: number;
}

export interface Zpool {
  name: string;
  guid: number;
  status: PoolStatus;
  healthy: boolean;
  warning: boolean;
  status_code: string;
  status_detail: string | null;
  properties: Record<string, ZpoolProperty>;
  topology: PoolTopology | null;
  scan: PoolScanUpdate | null;
  expand: unknown;
  features: unknown;
}
