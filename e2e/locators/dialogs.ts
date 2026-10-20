/**
 * webui's shared confirmation dialog (`DialogService.confirm`).
 *
 * Not a screen of its own — it is raised over whatever screen triggered it, by
 * storage, sharing, services and most destructive actions alike. It gets its own
 * module for that reason: the ids belong to the dialog component, not to any one
 * caller, and copying them into each flow is how they drift.
 */

export const confirmDialogLocators = {
  /**
   * The "confirm" tick box.
   *
   * Present only when the dialog was raised without `hideCheckbox: true`. The
   * confirm button stays disabled until it is ticked, which is the whole point
   * of the pattern for destructive actions.
   */
  checkbox: '[data-test="checkbox-confirm"]',

  /**
   * The caller's own extra option above the buttons, raised with `secondaryCheckbox: true` —
   * "Keep snapshots with their original retention period" when a periodic snapshot task is deleted.
   * It gates nothing; whether it was ticked is handed back to the caller with the confirmation.
   */
  secondaryCheckbox: '[data-test="checkbox-secondary-confirmation"]',

  /** `<tn-dialog-shell testId="confirm">`. What to wait on before acting on it. */
  title: '[data-test="dialog-title-confirm"]',

  /** The caller's message, rendered as HTML, so its text is read without the markup. */
  message: '[data-test="text-confirm-message"]',

  confirm: '[data-test="button-dialog-confirm"]',
  cancel: '[data-test="button-dialog-cancel"]',
} as const;

/**
 * webui's shared general dialog (`DialogService.generalDialog`).
 *
 * Its buttons are whatever the caller asks for. A caller that passes only
 * `cancelBtnMsg` gets a single button under `button-cancel`, whatever it is
 * labelled.
 */
export const generalDialogLocators = {
  title: '[data-test="dialog-title-general"]',
  cancel: '[data-test="button-cancel"]',
} as const;

/**
 * webui's shared information dialog (`DialogService.info` and `.warn`).
 *
 * Raised by the first-time warning in front of every form on Advanced Settings,
 * and by any action that reports its result in a dialog rather than a snackbar.
 */
export const infoDialogLocators = {
  title: '[data-test="text-info-title"]',
  message: '[data-test="text-info-message"]',
  close: '[data-test="button-dialog-close"]',
} as const;

/**
 * webui's error dialog — what a refused middleware call is reported in.
 *
 * Shared chrome like the confirm dialog above, raised over whatever was on
 * screen. Its close button is `errorDialogClose` in `support/constants.ts`,
 * which the harness also watches for; the title is here for a journey whose
 * claim is that an action *was* refused.
 */
export const errorDialogLocators = {
  title: '[data-test="dialog-title-error"]',

  /** The message: middleware's own text, wrapped in `<pre>` for a failed job. */
  message: '[data-test="text-error-message"]',

  /** "View Details", which unfolds the details table. Rendered only when the error has details. */
  viewDetails: '[data-test="link-view-details"]',

  /**
   * A failed job's log, as a row of that table. The row is labelled "Logs Excerpt" and
   * folded behind its own Show link, so the text is in the DOM only once that is clicked.
   */
  showLogsExcerpt: '[data-test="link-show-detail-logs-excerpt"]',
  logsExcerpt: '[data-test="text-error-detail-logs-excerpt"]',
} as const;

/**
 * webui's logs dialog (`DialogService.showLogs`): a finished job's `logs_excerpt`,
 * raised by a task's state on Data Protection when the job did not fail.
 */
export const showLogsDialogLocators = {
  title: '[data-test="dialog-title-show-logs"]',
  logs: '[data-test="text-logs-excerpt"]',
  close: '[data-test="button-close"]',
} as const;
