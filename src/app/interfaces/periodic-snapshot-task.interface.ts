import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface PeriodicSnapshotTask {
  schedule: Schedule;
  allow_empty?: boolean;
  dataset: string;
  enabled?: boolean;
  exclude?: string[];
  id: number;
  lifetime_unit: LifetimeUnit;
  lifetime_value: number;
  naming_schema: string;
  recursive: boolean;
  state: DataProtectionTaskState;
  vmware_sync: boolean;
}

export interface PeriodicSnapshotTaskCreate {
  dataset: string;
  recursive: boolean;
  exclude?: string[];
  lifetime_value: number;
  lifetime_unit: LifetimeUnit;
  naming_schema: string;
  schedule: Schedule;
  allow_empty?: boolean;
  enabled?: boolean;
}

export interface PeriodicSnapshotTaskUpdate extends PeriodicSnapshotTaskCreate {
  fixate_removal_date?: boolean;
}

export interface PeriodicSnapshotTaskUi extends PeriodicSnapshotTask {
  keepfor: string;
  when: string;
  next_run: string;
  last_run: string;
  legacy: boolean;
}

/**
 * Reads a `pool.snapshottask.query` row into the shape the data protection pages are written against.
 * The generated entry spells the enums as wire literals and leaves the fields middleware defaults
 * optional; it describes the same object.
 *
 * The `as` checks only that the two types are comparable, not that every field the UI reads is
 * present: a regenerated entry that drops or renames a field still compiles, and reads `undefined`.
 */
export function toPeriodicSnapshotTask(task: WebUiQueryEntity<'pool.snapshottask.query'>): PeriodicSnapshotTask {
  return task as PeriodicSnapshotTask;
}
