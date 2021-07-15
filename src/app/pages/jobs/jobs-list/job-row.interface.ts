import { Job } from 'app/interfaces/job.interface';

export interface JobRow extends Omit<Job, 'shutdown_timeout'> {
  name: string;
  date_started: string;
  date_finished: string;
}
