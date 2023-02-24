import { Job } from 'app/interfaces/job.interface';

export interface ErrorReport {
  title: string;
  message: string;
  backtrace: string;
}

export interface ErrorReportWithLogs {
  title: string;
  message: string;
  backtrace: string;
  logs: Job;
}

export interface MultiFieldsErrorReport {
  [field: string]: string | ErrorReport;
}
