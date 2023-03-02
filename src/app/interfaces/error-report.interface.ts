import { Job } from 'app/interfaces/job.interface';

export interface ErrorReport {
  title: string;
  message: string;
  backtrace?: string;
  logs?: Job;
}
