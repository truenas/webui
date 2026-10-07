import { CallParams, EventUnion } from '@truenas/api-client';
import { ZfsSnapshotRetentionSource } from 'app/enums/zfs-snapshot-retention-source.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface ZfsSnapshot {
  name: string;
  dataset: string;
  id: string;
  pool: string;
  // Optional because `pool.snapshot.query` callers can opt out of the
  // expensive `extra.properties` projection. `creation.parsed` is typed as
  // unix-seconds (the current middleware contract); `getSnapshotCreationMs`
  // detects and rejects pre-rebase servers still returning `{ $date }` at
  // runtime (rendering "N/A" + a dev warning rather than a wrong date), so the
  // type stays narrow for the 99% case.
  properties?: {
    [property: string]: ZfsProperty<string | number | boolean>;
    creation: ZfsProperty<string, number>;
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
  exclude?: string[];
  suspend_vms?: boolean;
  properties?: Record<string, unknown>;
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

/** A snapshot as `pool.snapshot.query` returns it, whole or narrowed by `select`, or as its change events carry it. */
type SnapshotRow
  = | Partial<WebUiQueryEntity<'pool.snapshot.query'>>
    | Extract<EventUnion<WebUiApiDirectory, 'pool.snapshot.query'>, { fields: unknown }>['fields'];

/**
 * Reads a snapshot into `ZfsSnapshot`. The generated entry types each ZFS property's `parsed` as `unknown` and
 * `retention.datetime` as a string where the wire sends a `$date` envelope (gap 15 in docs/devs/typed-api-client.md);
 * it describes the same object.
 *
 * A plain `as` does not compile here: the property records are not comparable with `ZfsProperty`. So the cast
 * checks nothing, and a regenerated entry that drops or renames a field still compiles and reads `undefined`.
 */
export function toZfsSnapshot(snapshot: SnapshotRow): ZfsSnapshot {
  return snapshot as unknown as ZfsSnapshot;
}

/** What `pool.snapshot.create` takes, as middleware declares it. */
export type CreateZfsSnapshotArgs = CallParams<WebUiApiDirectory, 'pool.snapshot.create'>[0];

/**
 * Hands the form's payload to `pool.snapshot.create` unchanged. Middleware declares a union of a snapshot with a
 * `name` and one with a `naming_schema`; the form sends exactly one of the two, which one `CreateZfsSnapshot` with
 * both optional cannot say.
 */
export function toCreateZfsSnapshotArgs(params: CreateZfsSnapshot): CreateZfsSnapshotArgs {
  return params as CreateZfsSnapshotArgs;
}
