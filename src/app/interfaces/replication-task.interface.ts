import { CallParams } from '@truenas/api-client';
import { CompressionType } from 'app/enums/compression-type.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { Job } from 'app/interfaces/job.interface';
import { KeychainSshCredentials } from 'app/interfaces/keychain-credential.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DataProtectionTaskState } from './data-protection-task-state.interface';

export interface ReplicationTask {
  allow_from_scratch?: boolean;
  also_include_naming_schema?: string[];
  auto: boolean;
  compressed?: boolean;
  compression?: CompressionType;
  direction: Direction;
  embed?: boolean;
  enabled?: boolean;
  encryption?: boolean;
  encryption_inherit?: boolean;
  encryption_key?: string;
  encryption_key_format?: EncryptionKeyFormat;
  encryption_key_location?: string;
  exclude?: string[];
  hold_pending_snapshots?: boolean;
  id: number;
  job?: Job;
  large_block?: boolean;
  lifetime_unit?: LifetimeUnit;
  lifetime_value?: number;
  logging_level?: LoggingLevel;
  name: string;
  name_regex: string;
  naming_schema?: string[];
  netcat_active_side?: NetcatMode;
  netcat_active_side_listen_address?: string;
  netcat_active_side_port_max?: number;
  netcat_active_side_port_min?: number;
  netcat_passive_side_connect_address?: string;
  only_matching_schedule?: boolean;
  periodic_snapshot_tasks?: PeriodicSnapshotTask[];
  properties?: boolean;
  properties_exclude?: string[];
  properties_override?: Record<string, string | number | boolean>;
  readonly?: ReadOnlyMode;
  recursive: boolean;
  replicate?: boolean;
  restrict_schedule?: Schedule;
  retention_policy: RetentionPolicy;
  retries?: number;
  schedule?: Schedule;
  source_datasets?: string[];
  speed_limit?: number;
  ssh_credentials?: KeychainSshCredentials;
  state: DataProtectionTaskState;
  target_dataset: string;
  transport: TransportMode;
  has_encrypted_dataset_keys?: boolean;
}

export interface ReplicationCreate {
  name: string;
  direction: Direction;
  transport: TransportMode;
  ssh_credentials?: number | null;
  netcat_active_side?: NetcatMode | null;
  netcat_active_side_listen_address?: string | null;
  netcat_active_side_port_max?: number | null;
  netcat_active_side_port_min?: number | null;
  netcat_passive_side_connect_address?: string | null;
  source_datasets?: string[];
  target_dataset: string;
  recursive: boolean;
  exclude?: string[];
  properties?: boolean;
  properties_exclude?: string[];
  properties_override?: Record<string, string | number | boolean>;
  replicate?: boolean;
  encryption?: boolean;
  encryption_inherit?: boolean | null;
  encryption_key?: string | null;
  encryption_key_format?: EncryptionKeyFormat | null;
  encryption_key_location?: string;
  periodic_snapshot_tasks?: number[];
  naming_schema?: string[];
  also_include_naming_schema?: string[];
  name_regex?: string | null;
  auto: boolean;
  schedule?: Schedule;
  restrict_schedule?: Schedule;
  only_matching_schedule?: boolean;
  allow_from_scratch?: boolean;
  readonly?: ReadOnlyMode;
  hold_pending_snapshots?: boolean;
  retention_policy: RetentionPolicy;
  lifetime_value?: number | null;
  lifetime_unit?: LifetimeUnit | null;
  lifetimes?: Schedule[];
  compression?: CompressionType | null;
  speed_limit?: number | null;
  large_block?: boolean;
  embed?: boolean;
  compressed?: boolean;
  retries?: number;
  logging_level?: LoggingLevel | null;
  enabled: boolean;
  sudo?: boolean;
}

/**
 * Reads a `replication.query` row into the shape the data protection pages are written against. The generated
 * entry spells the enums as wire literals, leaves the fields middleware defaults optional and types
 * `job`, `state` and the SSH credential as loose records; it describes the same object.
 *
 * The cast checks nothing: a regenerated entry that drops or renames a field still compiles, and
 * reads `undefined`.
 */
export function toReplicationTask(task: WebUiQueryEntity<'replication.query'>): ReplicationTask {
  return task as unknown as ReplicationTask;
}

/** What `replication.create` and `replication.update` take, as middleware declares it. */
export type ReplicationCreateArgs = CallParams<WebUiApiDirectory, 'replication.create'>[0];

/**
 * Hands a form's payload to `replication.create` / `replication.update` unchanged. Middleware
 * declares `source_datasets` as a non-empty list, which `string[]` cannot express; both the form
 * and the wizard require a source dataset before they submit.
 */
export function toReplicationCreateArgs(payload: ReplicationCreate): ReplicationCreateArgs {
  return payload as ReplicationCreateArgs;
}
