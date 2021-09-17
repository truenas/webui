import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { DataProtectionTaskState } from 'app/interfaces/data-protection-task-state.interface';
import { Schedule } from 'app/interfaces/schedule.interface';

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

export type PeriodSnapshotTaskUpdate = Omit<PeriodicSnapshotTask, 'id' | 'state' | 'vmware_sync'>;

export interface PeriodicSnapshotTaskUi extends PeriodicSnapshotTask {
  keepfor: string;
  cron_schedule: string;
  when: string;
  frequency: string;
  next_run: string;
}
