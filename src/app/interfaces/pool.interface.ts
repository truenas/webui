import { JobParams } from '@truenas/api-client';
import { DeduplicationSetting, NewDeduplicationQuotaSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

type D = WebUiApiDirectory;

export interface Pool {
  autotrim: ZfsProperty<string>;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encrypt: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey: string;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  encryptkey_path: string;
  guid: string;
  healthy: boolean;
  id: number;

  /**
   * @deprecated Legacy encryption. Not supported in Scale.
   */
  is_decrypted: boolean;
  name: string;
  path: string;
  scan: PoolScanUpdate;
  status: PoolStatus;
  status_code?: string;
  status_detail: string;
  topology: PoolTopology;

  /**
   * Available with extra is_upgraded=true
   */
  is_upgraded?: boolean;
  size: number;
  used?: number;
  available?: number;
  algorithm: ZfsProperty<string, string>;
  dedup_table_quota: string | null;
  dedup_table_size: number;
  all_sed?: boolean;
  special_class_used?: number;
  /**
   * Raw special-vdev free space as reported by ZFS, before the metadata reserve
   * is carved out. The Usage card subtracts the configured reserve for display.
   */
  special_class_available?: number;
  special_class_usable?: number;
}

export type PoolTopology = Record<VDevType, VDevItem[]>;

export interface PoolScanUpdate {
  bytes_issued: number;
  bytes_processed: number;
  bytes_to_process: number;
  end_time: ApiTimestamp;
  errors: number;
  function: PoolScanFunction;
  pause: ApiTimestamp | null;
  percentage: number;
  start_time: ApiTimestamp;
  state: PoolScanState;
  total_secs_left: number | null;
}

export interface CreatePool {
  encryption: boolean;
  encryption_options?: {
    generate_key: boolean;
    passphrase?: string;
    key?: string;
  };
  all_sed?: boolean;
  name: string;
  topology: UpdatePoolTopology;
  checksum?: string;
  dedup_table_quota?: NewDeduplicationQuotaSetting;
  deduplication?: DeduplicationSetting;
  allow_duplicate_serials?: boolean;
  // Community Edition only: bypasses topology policy checks (equal data-vdev width,
  // RAIDZ/mirror width caps, special/dedup redundancy rule). Rejected on Enterprise.
  force_topology?: boolean;
}

export interface UpdatePool {
  topology?: UpdatePoolTopology;
  autotrim?: OnOff;
  allow_duplicate_serials?: boolean;
  all_sed?: boolean;
  dedup_table_quota?: NewDeduplicationQuotaSetting;
  dedup_table_quota_value?: number;
  // Community Edition only: bypasses topology policy checks (equal data-vdev width,
  // RAIDZ/mirror width caps, special/dedup redundancy rule). Rejected on Enterprise.
  force_topology?: boolean;
}

// TODO: Maybe replace first 5 keys with VDevType enum once old pool manager is removed.
export interface UpdatePoolTopology {
  data?: DataPoolTopologyUpdate[];
  special?: { type: CreateVdevLayout; disks: string[] }[];
  dedup?: { type: CreateVdevLayout; disks: string[] }[];
  cache?: { type: CreateVdevLayout; disks: string[] }[];
  log?: { type: CreateVdevLayout; disks: string[] }[];
  // Note that here spares is a correct name, not spare.
  spares?: string[];
}

export interface DataPoolTopologyUpdate {
  type: CreateVdevLayout;
  disks: string[];
  draid_data_disks?: number;
  draid_spare_disks?: number;
}

/** What `pool.attach` takes, as middleware declares it. */
export type PoolAttachParams = JobParams<D, 'pool.attach'>[1];

export interface PoolInstance {
  id: number;
  name: string;
  guid: string;
  encrypt: number;
  encryptkey: string;
  encryptkey_path: string;
  is_decrypted: boolean;
  status: PoolStatus;
  path: string;
  scan: PoolScanUpdate | null;
  is_upgraded: boolean;
  healthy: boolean;
  warning: boolean;
  status_detail: string;
  size: number;
  allocated: number;
  free: number;
  freeing: number;
  fragmentation: string;
  autotrim: ZfsProperty<string>;
  topology: PoolTopology;
}

/** What `pool.ddt_prune` takes, as middleware declares it. */
export type PruneDedupTableParams = JobParams<D, 'pool.ddt_prune'>[0];

/**
 * Reads a `pool.query` row, or the entry `pool.create` / `pool.update` return, into the shape the storage pages
 * are written against. The generated entry spells `status`, the scan and the topology's enums as wire literals,
 * types the timestamps as strings although they arrive as `ApiTimestamp` envelopes (gap 15), and does not declare
 * `is_upgraded` or the tier sizes the dashboard adds; it describes the same object.
 *
 * The cast checks nothing, so a regenerated entry that drops or renames a field still compiles and reads `undefined`.
 */
export function toPool(pool: WebUiQueryEntity<'pool.query'>): Pool {
  return pool as unknown as Pool;
}

/** What `pool.create` takes, as middleware declares it. */
export type PoolCreateArgs = JobParams<D, 'pool.create'>[0];

/** What `pool.update` takes as its changes, as middleware declares it. */
export type PoolUpdateArgs = JobParams<D, 'pool.update'>[1];

/**
 * Hands the pool wizard's payload to `pool.create` unchanged. Middleware narrows each vdev class to the layouts it
 * allows (a cache vdev is only a `STRIPE`) and `checksum` to its algorithms; the wizard builds every class from the
 * one `CreateVdevLayout` and offers only what middleware accepts, so they are the same values typed loosely.
 */
export function toPoolCreateArgs(payload: CreatePool): PoolCreateArgs {
  return payload as PoolCreateArgs;
}

/** {@link toPoolCreateArgs} for `pool.update`. */
export function toPoolUpdateArgs(payload: UpdatePool): PoolUpdateArgs {
  return payload as PoolUpdateArgs;
}
