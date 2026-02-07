import { Params } from '@angular/router';
import { Job } from 'app/interfaces/job.interface';

export const traceDetailLabel = 'Trace';
export const logsExcerptDetailLabel = 'Logs Excerpt';
export const collapsibleDetailLabels = new Set([traceDetailLabel, logsExcerptDetailLabel]);

export interface ErrorReportAction {
  label: string;
  route?: string;
  params?: Params;
  action?: () => void;
}

export interface ErrorDetails {
  label: string;
  value: string | number | boolean | null;
}

export interface ErrorReport {
  title: string;
  message: string;
  hint?: string;
  stackTrace?: string;
  logs?: Job;
  icon?: string;
  actions?: ErrorReportAction[];
  details?: ErrorDetails[];
}
