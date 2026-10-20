/**
 * The jobs panel the topbar's clipboard opens.
 *
 * Each job is an `<ix-job-item>` whose body is tagged `[tnTestId]="['job', job.id]"`
 * as a row, so a job's ids carry middleware's job id and nothing a translation
 * can rename. The panel lists a job twice over its life: under the running jobs
 * while it is running or waiting, then among the five most recently finished.
 * The two lists carry ids of their own, so "where is it" is a selector rather
 * than an inference from which readouts the row happens to show.
 *
 * A running `abortable` job's Abort sits beside its row's body rather than in
 * it, and its id carries the job's description and method but not its id.
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
