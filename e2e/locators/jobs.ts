/**
 * The Jobs page at `/jobs` (`jobs-list.component.html`), reached from the jobs
 * panel's "View All Jobs".
 *
 * It lists every job in the app's job store, which is every job on the
 * appliance, so everything here is keyed by middleware's job id. The row tag is
 * `job-<id>`, the same tag the jobs panel gives its rows, so `row(id)` would
 * also match a row in the panel. The two are never on screen together: the
 * panel closes as the page opens.
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
