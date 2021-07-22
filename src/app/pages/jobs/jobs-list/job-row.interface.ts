import { Job } from 'app/interfaces/job.interface';

export interface JobRow extends Job {
  date_started: string;
  date_finished: string;
}
