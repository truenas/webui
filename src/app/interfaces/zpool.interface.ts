import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolScanUpdate, PoolTopology } from 'app/interfaces/pool.interface';

export interface ZpoolProperty {
  raw: string;
  source: string | null;
  // ZFS properties arrive parsed, but the wire format varies by property:
  // size-like properties (e.g. class_*_available) come as numbers,
  // while string-typed properties (e.g. compressratio) come as strings.
  value: number | string;
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
