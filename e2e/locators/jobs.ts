/**
 * The Jobs page at `/jobs` (`jobs-list.component.html`), reached from the panel's "View All Jobs". It lists every
 * job on the appliance, keyed by middleware's job id. Its row tag `job-<id>` matches the jobs panel's too, but the
 * panel closes as the page opens, so they're never on screen together.
 */
export const jobsPageLocators = {
  /** The state filter, a `tn-button-toggle` each. `aria-pressed` says which one is on. */
  filter: {
    all: '[data-test="button-toggle-all"]',
    active: '[data-test="button-toggle-active"]',
    failed: '[data-test="button-toggle-failed"]',
  },

  row: (jobId: number): string => `[data-test="row-job-${jobId}"]`,
  /**
   * The State cell's pill. Its text is the state as the app displays it, and a
   * click on a failed job raises the error dialog.
   */
  state: (jobId: number): string => `[data-test="button-state-job-${jobId}-row-state"]`,

  /**
   * The expanded row's readouts (`job-logs-row.component.html`). Log Excerpt
   * renders only when the job has one.
   */
  detail: {
    id: (jobId: number): string => `[data-test="text-job-${jobId}-id"]`,
    logExcerpt: (jobId: number): string => `[data-test="text-job-${jobId}-log-excerpt"]`,
  },
} as const;
