import { PoolScrub } from './pool-scrub.interface';

export interface ScrubTaskUi extends PoolScrub {
  cron_schedule: string;
  frequency: string;
  next_run: string;
}
