import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { Schedule } from 'app/interfaces/schedule.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

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

/**
 * Reads a `pool.scrub.query` row into `ScrubTask`. The generated entry leaves the fields middleware defaults optional
 * and types the schedule's fields loosely; it describes the same object.
 */
export function toScrubTask(task: WebUiQueryEntity<'pool.scrub.query'>): ScrubTask {
  return task as ScrubTask;
}
