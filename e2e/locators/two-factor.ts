/**
 * Two-factor authentication: the global card on System > Advanced Settings and
 * its form, the setup dialog, and the Access card's Clear button.
 *
 * The sign-in page's one-time password field is in `locators/signin.ts`, with
 * the rest of that form.
 */
import { kebabTestSegment } from './test-id';

export const twoFactorLocators = {
  globalCard: {
    /** Global two-factor: `Enabled` or `Disabled`. */
    state: '[data-test="text-global-2fa"]',
    /** `<tn-button [testId]="['two-factor-auth', 'configure']">` in the card footer. */
    configure: '[data-test="button-two-factor-auth-configure"]',
  },

  /**
   * Built by `ix-form-renderer` from `global-two-factor.form-config.ts`, so every
   * field's id is its control name — see `locators/console.ts`.
   */
  globalForm: {
    enabled: '[data-test="checkbox-enabled"]',
    /** How many 30-second steps either side of now a code is still accepted for. */
    window: '[data-test="input-window"]',
    save: '[data-test="button-save"]',
  },

  /**
   * `<tn-dialog-shell testId="two-factor-setup">`, which the admin layout's guard
   * raises in place of the shell for an account with no secret while global
   * two-factor is on. It wraps the same `ix-two-factor` component the
   * `/two-factor-auth` page shows.
   */
  setupDialog: {
    title: '[data-test="dialog-title-two-factor-setup"]',
    /**
     * "Configure 2FA Secret" — or "Renew 2FA Secret" once one exists; the two
     * labels share this id. Asks for no confirmation the first time.
     */
    configureSecret: '[data-test="button-renew-secret"]',
    /** The base32 secret, as text beside the QR code: what a person types into an app. */
    secret: '[data-test="text-secret"]',
    /** The code field, rendered only while the new secret awaits confirmation. */
    code: '[data-test="input-verify-otp"]',
    /** "Confirm Code". The app checks the code itself; nothing is sent to middleware. */
    confirmCode: '[data-test="button-verify-otp"]',
    /** Offered only once a code has been confirmed, and closes the dialog. */
    finish: '[data-test="button-finish-first-stig-login"]',
  },

  /**
   * "Clear Two-Factor Authentication" in the Access card's footer, offered only
   * while the user has a secret.
   */
  clearTwoFactor: (username: string): string => (
    `[data-test="button-clear-two-factor-${kebabTestSegment(username)}"]`
  ),
} as const;
