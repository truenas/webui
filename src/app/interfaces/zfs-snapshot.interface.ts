import { ZfsSnapshotRetentionSource } from 'app/enums/zfs-snapshot-retention-source.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export interface ZfsSnapshot {
  name: string;
  dataset: string;
  id: string;
  pool: string;
  properties: {
    [property: string]: ZfsProperty<string | number | boolean | ApiTimestamp>;
    creation: ZfsProperty<string, ApiTimestamp>;
  };
  holds?: {
    truenas?: number;
  };
  retention?: {
    datetime: ApiTimestamp;
    source: ZfsSnapshotRetentionSource;
    periodic_snapshot_task_id?: number;
  };
  snapshot_name: string;
  type: string; // "SNAPSHOT"
}

export interface CreateZfsSnapshot {
  dataset: string;
  name?: string;
  naming_schema?: string;
  recursive?: boolean;
  vmware_sync?: boolean;
  properties?: Record<string, unknown>;
}

export interface CloneZfsSnapshot {
  snapshot: string;
  dataset_dst: string;
  dataset_properties?: Record<string, unknown>;
}

export type ZfsRollbackParams = [
  id: string,
  params: {
    recursive?: boolean;
    recursive_clones?: boolean;
    force?: boolean;
    recursive_rollback?: boolean;
  },
];
