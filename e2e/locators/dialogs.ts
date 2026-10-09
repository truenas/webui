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

  /** `<tn-dialog-shell testId="confirm">`. What to wait on before acting on it. */
  title: '[data-test="dialog-title-confirm"]',

  confirm: '[data-test="button-dialog-confirm"]',
  cancel: '[data-test="button-dialog-cancel"]',
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
} as const;
