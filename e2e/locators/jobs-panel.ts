/**
 * The jobs panel the topbar's clipboard opens. Each `<ix-job-item>` body is `[tnTestId]="['job', job.id]"`, so
 * ids carry middleware's job id and nothing translatable. A job is listed under running jobs, then among the
 * five most recently finished; each list has its own id, so where a job sits is a selector, not an inference.
 * A running `abortable` job's Abort sits beside the body, and its id carries description and method, not id.
 */
import { kebabTestSegment } from './test-id';

export const jobsPanelLocators = {
  /** `<tn-dialog-shell testId="jobs-panel">`. Gone once the panel has closed. */
  title: '[data-test="dialog-title-jobs-panel"]',
  /** The running-jobs count in the panel's header. Present whenever the panel is open, loaded or not. */
  runningCount: '[data-test="text-running-jobs-count"]',
  /**
   * The recently-finished list, rendered once the panel's jobs have loaded — and
   * only then is the app subscribed to job events, so a job started earlier can
   * be missed.
   */
  finishedList: '[data-test="list-finished-jobs"]',
  /** "View All Jobs" in the footer: closes the panel and opens the Jobs page, which has no sidebar entry. */
  viewAllJobs: '[data-test="button-history"]',

  /** A job anywhere in the panel. */
  job: (jobId: number): string => `[data-test="row-job-${jobId}"]`,
  /** A job in the running-and-waiting list. */
  ongoingJob: (jobId: number): string => `[data-test="list-ongoing-jobs"] [data-test="row-job-${jobId}"]`,
  /** A job in the recently-finished list, which holds succeeded and failed jobs alike. */
  finishedJob: (jobId: number): string => `[data-test="list-finished-jobs"] [data-test="row-job-${jobId}"]`,
  /** Its progress percentage, rendered only while the job is running. */
  progress: (jobId: number): string => `[data-test="text-job-${jobId}-progress"]`,
  /**
   * Abort on a running job, `['abort', description, method]`. A job with no description leaves
   * that part out. Scoped to the running list, the only place it renders. Two running jobs with
   * the same description and method would share it.
   */
  abort: (description: string | null, method: string): string => {
    const parts = ['abort', description, method].filter((part): part is string => Boolean(part));
    return `[data-test="list-ongoing-jobs"] [data-test="button-${parts.map(kebabTestSegment).join('-')}"]`;
  },
} as const;
