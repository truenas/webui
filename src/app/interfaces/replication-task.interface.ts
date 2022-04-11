import { CompressionType } from 'app/enums/compression-type.enum';
import { Direction } from 'app/enums/direction.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { ReplicationEncryptionKeyFormat } from 'app/enums/replication-encryption-key-format.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { Job } from 'app/interfaces/job.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';
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
  encryption_key?: string;
  encryption_key_format?: ReplicationEncryptionKeyFormat;
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
  naming_schema?: string[];
  netcat_active_side?: NetcatMode;
  netcat_active_side_listen_address?: string;
  netcat_active_side_port_max?: number;
  netcat_active_side_port_min?: number;
  netcat_passive_side_connect_address?: string;
  only_matching_schedule?: boolean;
  periodic_snapshot_tasks?: number[] | PeriodicSnapshotTask[];
  properties?: boolean;
  properties_exclude?: string[];
  properties_override?: Record<string, unknown>;
  readonly?: ReadOnlyMode;
  recursive: boolean;
  replicate?: boolean;
  restrict_schedule?: Schedule;
  retention_policy: RetentionPolicy;
  retries?: number;
  schedule?: Schedule | boolean;
  schedule_method: ScheduleMethod;
  schedule_picker: string;
  source_datasets?: string[];
  source_datasets_from: string;
  speed_limit?: number;
  ssh_credentials?: SshCredentials | number[];
  state: DataProtectionTaskState;
  target_dataset: string;
  target_dataset_from: string;
  transport: TransportMode;
}

export interface ReplicationTaskUi extends ReplicationTask {
  ssh_connection: string;
  task_last_snapshot: string;
}

export interface ReplicationCreate {
  name: string;
  direction: Direction;
  transport: TransportMode;
  ssh_credentials?: SshCredentials | number[];
  netcat_active_side?: NetcatMode;
  netcat_active_side_listen_address?: string;
  netcat_active_side_port_max?: number;
  netcat_active_side_port_min?: number;
  netcat_passive_side_connect_address?: string;
  source_datasets?: string[];
  target_dataset: string;
  recursive: boolean;
  exclude?: string[];
  properties?: boolean;
  properties_exclude?: string[];
  properties_override?: Record<string, unknown>;
  replicate?: boolean;
  encryption?: boolean;
  encryption_key?: string;
  encryption_key_format?: ReplicationEncryptionKeyFormat;
  encryption_key_location?: string;
  periodic_snapshot_tasks?: number[] | PeriodicSnapshotTask[];
  naming_schema?: string[];
  also_include_naming_schema?: string[];
  name_regex?: string;
  auto: boolean;
  schedule?: Schedule;
  restrict_schedule?: Schedule;
  only_matching_schedule?: boolean;
  allow_from_scratch?: boolean;
  readonly?: ReadOnlyMode;
  hold_pending_snapshots?: boolean;
  retention_policy: RetentionPolicy;
  lifetime_value?: number;
  lifetime_unit?: LifetimeUnit;
  lifetimes?: Schedule[];
  compression?: CompressionType;
  speed_limit?: number;
  large_block?: boolean;
  embed?: boolean;
  compressed?: boolean;
  retries?: number;
  logging_level?: LoggingLevel;
  enabled: boolean;
}
