import { Cronjob } from 'app/interfaces/cronjob.interface';

export interface CronjobRow extends Cronjob {
  next_run: string;
}
