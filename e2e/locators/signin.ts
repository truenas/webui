/**
 * Sign-in page locators. Values are emitted `data-test` attributes, type-prefixed by `@truenas/ui-components` as
 * `${type}-${base}`: `<tn-input [testId]="'username'">` emits `input-username` on the inner `<input>`. This
 * contradicts `truenas-ui-components/docs/test_ids.md`, which predates `tnTestIdType`; the code is authoritative.
 */
export const signinLocators = {
  /** `<tn-input [testId]="'username'">` in signin-form.component.html */
  username: '[data-test="input-username"]',
  /** `<tn-input [testId]="'password'">` */
  password: '[data-test="input-password"]',
  /** `<tn-button [testId]="'log-in'">` */
  submit: '[data-test="button-log-in"]',
  /**
   * The eye toggle inside the password field.
   *
   * `<tn-input suffixActionTestId="toggle-password-password">`, and the suffix
   * button carries `tnTestIdType="button"` — hence the doubled word, which is
   * the field's own id (`password`) inside the action's (`toggle-password`).
   */
  passwordToggle: '[data-test="button-toggle-password-password"]',
  /**
   * The warning shown when the page was not served over HTTPS.
   *
   * `<tn-banner testId="insecure-connection">`. The library emits this on the
   * banner root, which is also what carries the live-region role — so the
   * element asserted on is the one assistive tech announces. Needs
   * `@truenas/ui-components` >= 0.7.8 (#319).
   */
  insecureConnectionBanner: '[data-test="banner-insecure-connection"]',
  /**
   * The inline failure message under submit, a plain block holding `SigninStore.getLoginErrorMessage`. A toast
   * says the same but clears after four seconds, so assert on this. The two-factor step renders its own failure
   * under the same id, so this matches whichever step failed.
   */
  error: '[data-test="text-login-error"]',
  /**
   * The one-time password field, which replaces username and password once
   * middleware has asked for a code. Submitted with {@link submit}: "Proceed" on
   * this step carries the same `log-in` id as "Log In" on the first.
   */
  otp: '[data-test="input-otp"]',
  /**
   * "Cancel" on the one-time password step, which goes back to the username and
   * password. `<tn-button [testId]="'otp-log-in'">`: the id reads like a submit,
   * and is the one the template has.
   */
  otpCancel: '[data-test="button-otp-log-in"]',
} as const;
