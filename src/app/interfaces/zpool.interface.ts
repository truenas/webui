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
  id: number;
  name: string;
  guid: number;
  status: PoolStatus;
  healthy: boolean;
  warning: boolean;
  status_code: string;
  status_detail: string | null;
  is_upgraded: boolean;
  all_sed?: boolean;
  properties: Record<string, ZpoolProperty> | null;
  topology: PoolTopology | null;
  scan: PoolScanUpdate | null;
  // `expand` and `features` are present on the wire but not consumed in the
  // UI — re-add them with concrete types when a consumer actually needs them.
}

export function getZpoolPropertyNumber(zpool: Zpool, key: string): number {
  const raw = zpool.properties?.[key]?.value;
  if (raw === undefined || raw === null) {
    return 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function getZpoolPropertyString(zpool: Zpool, key: string): string | null {
  const raw = zpool.properties?.[key]?.value;
  return raw === undefined || raw === null ? null : String(raw);
}

