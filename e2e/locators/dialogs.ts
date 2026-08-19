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

  confirm: '[data-test="button-dialog-confirm"]',
  cancel: '[data-test="button-dialog-cancel"]',
} as const;
