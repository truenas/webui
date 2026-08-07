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
  /** `<tn-menu-item [testId]="'log-out'">` inside the user menu */
  logOut: '[data-test="button-log-out"]',
} as const;
