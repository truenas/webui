/**
 * Topbar locators.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
export const topbarLocators = {
  /**
   * `<tn-icon-button testId="user-menu">` — the single trigger that projects the
   * username beside its icon, so it is both the menu trigger and where the
   * signed-in user's name is rendered.
   */
  userMenu: '[data-test="button-user-menu"]',
  /** `<tn-menu-item [testId]="'preferences'">` inside the user menu */
  preferences: '[data-test="button-preferences"]',
  /** `<tn-menu-item [testId]="'log-out'">` inside the user menu */
  logOut: '[data-test="button-log-out"]',
  /** `<tn-menu-item [testId]="'2-fa'">` inside the user menu, rendered only while two-factor is on globally */
  twoFactorAuth: '[data-test="button-2-fa"]',
  /** `<tn-menu-item [testId]="'change-password'">` inside the user menu, rendered only for a local account */
  changePassword: '[data-test="button-change-password"]',
  /** `<tn-icon-button testId="alerts-indicator">`, the bell that opens the alerts panel */
  alertsIndicator: '[data-test="button-alerts-indicator"]',
  /** `<tn-icon-button testId="jobs-manager">` in `ix-jobs-indicator`, which opens the jobs panel */
  jobsIndicator: '[data-test="button-jobs-manager"]',
  /** `<tn-icon-button testId="power-menu">`, which opens Restart and Shut Down */
  powerMenu: '[data-test="button-power-menu"]',
  /** `<tn-menu-item [testId]="'restart'">` inside the power menu */
  restart: '[data-test="button-restart"]',
  /** `<tn-menu-item [testId]="'shut-down'">` inside the power menu */
  shutDown: '[data-test="button-shut-down"]',

  /** `<tn-dialog-shell testId="change-password-dialog">`, raised by Change Password in the user menu. */
  changePasswordDialog: {
    /** What to wait on before acting on it, and what is gone once it closes. */
    title: '[data-test="dialog-title-change-password-dialog"]',
    /** The shell's own ✕ in the header. Closes without saving anything. */
    close: '[data-test="button-close-change-password-dialog"]',
    /**
     * `<tn-button testId="save">` in the footer, labelled "Change Password". Disabled while the
     * form is invalid. Unique on the page only because no side panel is open behind the dialog.
     */
    save: '[data-test="button-save"]',
    /** "Current Password". Rendered only for a user who is not a Full Admin. */
    currentPassword: '[data-test="input-old-password"]',
    /** The field around it, which holds middleware's refusal of a wrong current password. */
    currentPasswordField: '[data-test="form-field-old-password"]',
    newPassword: '[data-test="input-new-password"]',
    confirmPassword: '[data-test="input-password-confirmation"]',
    /** The field around it, which holds the mismatch error. */
    confirmPasswordField: '[data-test="form-field-password-confirmation"]',
  },
} as const;
