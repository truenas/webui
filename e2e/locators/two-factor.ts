/**
 * Two-factor authentication: the global card on System > Advanced Settings and
 * its form, the setup card, the first-login setup dialog, and the Access card's
 * two-factor line, Set up 2FA link and Clear button.
 *
 * The sign-in page's one-time password field is in `locators/signin.ts`, with
 * the rest of that form.
 */
import { kebabTestSegment } from './test-id';

export const twoFactorLocators = {
  globalCard: {
    /** Global two-factor: `Enabled` or `Disabled`. */
    state: '[data-test="text-global-2fa"]',
    /** Tolerance Window: the number of 30-second steps, as a bare number. */
    window: '[data-test="text-global-2fa-tolerance-window"]',
    /** Two Factor Authentication for SSH: `Enabled` or `Disabled`. */
    ssh: '[data-test="text-global-2fa-ssh"]',
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
    ssh: '[data-test="checkbox-ssh"]',
    save: '[data-test="button-save"]',
  },

  /**
   * The full-screen "Set Up Two-Factor Authentication" dialog the admin layout's
   * guard raises on the first route of a session while global two-factor is on
   * and the account has no secret. It cannot be closed by Escape; Skip Setup,
   * confirmed, is the way past it that leaves the account without a secret.
   */
  setupDialog: {
    /** `<tn-dialog-shell testId="two-factor-setup">`. */
    title: '[data-test="dialog-title-two-factor-setup"]',
    skip: '[data-test="button-skip-2fa-setup"]',
    /** "Finish", rendered only once the account holds a secret and no code is still awaited. */
    finish: '[data-test="button-finish-first-stig-login"]',
  },

  /**
   * The `ix-two-factor` card on the `/two-factor-auth` page. The first-login
   * dialog wraps the same component; its own title and Skip Setup are under
   * `setupDialog`.
   */
  setup: {
    /**
     * "Configure 2FA Secret" — or "Renew 2FA Secret" once one exists; the two
     * labels share this id. Asks for no confirmation the first time.
     */
    configureSecret: '[data-test="button-renew-secret"]',
    /** The base32 secret, as text beside the QR code: what a person types into an app. */
    secret: '[data-test="text-secret"]',
    /** The code field, rendered only while the new secret awaits confirmation. */
    code: '[data-test="input-verify-otp"]',
    /** The field around {@link code}, `testId="verify-otp"`, which holds its error text. */
    codeField: '[data-test="form-field-verify-otp"]',
    /** "Confirm Code". The app checks the code itself; nothing is sent to middleware. */
    confirmCode: '[data-test="button-verify-otp"]',
    /** "Cancel Setup", beside {@link confirmCode}. Confirmed, it unsets the secret awaiting a code. */
    cancelSetup: '[data-test="button-cancel-2fa-setup"]',
    /** Rendered only once the account holds a secret and no code is still awaited. */
    unsetSecret: '[data-test="button-unset-2fa-secret"]',
  },

  /**
   * "Clear Two-Factor Authentication" in the Access card's footer, offered only
   * while the user has a secret.
   */
  clearTwoFactor: (username: string): string => (
    `[data-test="button-clear-two-factor-${kebabTestSegment(username)}"]`
  ),

  /**
   * The Access card's two-factor line: "Has Two-Factor Authentication" or "No
   * Two-Factor Authentication". Rendered only while global two-factor is on.
   */
  userStatus: (username: string): string => (
    `[data-test="text-two-factor-status-${kebabTestSegment(username)}"]`
  ),

  /**
   * "Set up 2FA" on the Access card, a link to `/two-factor-auth`. Offered only
   * on your own account, while global two-factor is on and you have no secret.
   */
  setUpLink: (username: string): string => `[data-test="link-setup-2fa-${kebabTestSegment(username)}"]`,
} as const;
