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
 * webui's shared information dialog (`DialogService.info` and `.warn`).
 *
 * Raised by the first-time warning in front of every form on Advanced Settings,
 * and by any action that reports its result in a dialog rather than a snackbar.
 */
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

export const infoDialogLocators = {
  title: '[data-test="text-info-title"]',
  message: '[data-test="text-info-message"]',
  close: '[data-test="button-dialog-close"]',
} as const;
