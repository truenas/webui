/**
 * The Access card on System > Advanced Settings.
 *
 * Only the session timeout half of the card. Its readout is tagged
 * `tnTestIdType="text"`, so the id is static, and it holds the duration alone,
 * without its label. The "Preferences" link in the hint below it is a plain
 * `<button>` tagged `tnTestIdType="button"`.
 *
 * The timeout is not an Access setting: it is the signed-in account's own
 * preference, and the link opens the Preferences form. That form's ids are in
 * `preferences.ts`.
 */
export const accessLocators = {
  card: {
    /** `formatDuration` of the stored lifetime, e.g. `10 minutes` or `2 hours`. */
    sessionTimeout: '[data-test="text-access-session-timeout"]',
    /** Opens the Preferences form, the only place the timeout is edited. */
    openPreferences: '[data-test="button-access-open-preferences"]',
  },
} as const;
