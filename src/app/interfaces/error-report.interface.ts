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
   * Names this particular error, so automation can tell one dialog from
   * another.
   *
   * Every error opens the same component, so without this they all carry one
   * test ID and the only thing separating them is their wording — which moves
   * when a message is reworded or translated. Set it where a test needs to
   * find, dismiss, or assert on a specific error; leave it unset and the
   * dialog keeps the shared `error` base it has always had.
   */
  testId?: string;
  hint?: string;
  stackTrace?: string;
  logs?: Job;
  actions?: ErrorReportAction[];
  details?: ErrorDetails[];
}
