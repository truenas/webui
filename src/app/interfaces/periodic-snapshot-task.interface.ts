import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { Schedule } from 'app/interfaces/schedule.interface';

interface PeriodicSnapshotTaskState {
  state: string;
  error: string;
}

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
  state: PeriodicSnapshotTaskState;
  vmware_sync: boolean;
}

export interface PeriodicSnapshotTaskUi extends PeriodicSnapshotTask {
  keepfor: string;
  cron_schedule: string;
  when: string;
  frequency: string;
  next_run: string;
}
