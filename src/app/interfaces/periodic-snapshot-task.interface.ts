import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
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
}
