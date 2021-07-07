import { Cronjob } from 'app/interfaces/cronjob.interface';

export interface CronjobRow extends Cronjob {
  cron_schedule: string;
  next_run: string;
}
