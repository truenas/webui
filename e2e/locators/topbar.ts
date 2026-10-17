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
} as const;
