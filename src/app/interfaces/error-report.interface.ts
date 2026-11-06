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
  /**
   * Names this error's dialog for automation. Every error shares one component, so without it they
   * differ only by wording, which changes with translation. Set it where a test needs to find a specific
   * error; unset keeps the shared `error` id.
   */
  testId?: string;
  hint?: string;
  stackTrace?: string;
  logs?: Job;
  actions?: ErrorReportAction[];
  details?: ErrorDetails[];
}
