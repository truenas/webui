import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { Schedule } from 'app/interfaces/schedule.interface';

export interface PoolScrubTask {
  description: string;
  enabled: boolean;
  id: number;
  pool: number;
  pool_name: string;
  schedule: Schedule;
  threshold: number;
}

export type CreatePoolScrubTask = Omit<PoolScrubTask, 'id' | 'pool_name'>;

export type PoolScrubTaskParams = [
  poolId: number,
  params: PoolScrubAction,
];
