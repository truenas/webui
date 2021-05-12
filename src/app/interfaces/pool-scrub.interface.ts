import { Schedule } from 'app/interfaces/schedule.interface';

export interface PoolScrub {
  description: string;
  enabled: boolean;
  id: number;
  pool: number;
  pool_name: string;
  schedule: Schedule;
  threshold: number;
}
