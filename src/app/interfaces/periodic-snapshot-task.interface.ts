import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { Schedule } from 'app/interfaces/schedule.interface';

interface PeriodicSnapshotTaskState {
  state: string;
  error: string;
}

export interface PeriodicSnapshotTaskRaw {
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
}

/*
 * See middleware for details
 * https://github.com/truenas/middleware/blob/HEAD/src/middlewared/middlewared/plugins/snapshot.py#L51
*/
export interface PeriodicSnapshotTask extends PeriodicSnapshotTaskRaw {
  state: PeriodicSnapshotTaskState;
  vmware_sync: boolean;
}

export interface PeriodicSnapshotTaskUI extends PeriodicSnapshotTask {
  keepfor: string;
  cron: string;
  when: string;
  frequency: string;
  next_run: string;
}
