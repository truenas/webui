/**
 * System > Update.
 */
export const updateLocators = {
  /** Manual Update's Install. The page renders it whatever the update check returned. */
  installManualUpdate: '[data-test="button-install-manual-update"]',
  /** The version the update server offers. Rendered only when it offers one. */
  updateVersion: '[data-test="text-update-version"]',
  /** "System is up to date!". Rendered only when the check succeeded and offered nothing. */
  upToDate: '[data-test="text-system-up-to-date"]',
} as const;
