import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface ScrubTask {
  description: string;
  enabled: boolean;
  id: number;
  pool: number;
  pool_name: string;
  schedule: Schedule;
  threshold: number;
}

export type CreateScrubTask = Omit<ScrubTask, 'id' | 'pool_name'>;

export type PoolScrubTaskParams = [
  poolId: number,
  params: PoolScrubAction,
];
