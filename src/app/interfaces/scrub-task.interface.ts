import { PoolScrubTask } from './pool-scrub.interface';

export interface ScrubTaskUi extends PoolScrubTask {
  cron_schedule: string;
  frequency: string;
  next_run: string;
}
