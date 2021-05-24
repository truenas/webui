import { Schedule } from './schedule.interface';

export interface ScrubTask {
  description: string;
  enabled: boolean;
  id: number;
  pool: number;
  pool_name: string;
  schedule: Schedule;
  threshold: number;
}

export interface ScrubTaskUI extends ScrubTask {
  cron_schedule: string;
  frequency: string;
  next_run: string;
}
