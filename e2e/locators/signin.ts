/**
 * Sign-in page locators.
 *
 * Values are the emitted `data-test` attributes, which are type-prefixed by
 * `@truenas/ui-components`: the component declares `tnTestIdType` and the
 * directive composes `${type}-${base}`. So a template writing
 * `<tn-input [testId]="'username'">` emits `data-test="input-username"` on the
 * inner `<input>`.
 *
 * Note this contradicts `truenas-ui-components/docs/test_ids.md`, which still
 * describes values as rendered verbatim. The code is authoritative; the doc
 * predates `tnTestIdType`.
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
   * The failure message under the submit button.
   *
   * Inline, and *not* a form-field error: the component renders a plain block
   * holding whatever `SigninStore.getLoginErrorMessage` returned. A toast
   * carries the same words, but it clears itself after four seconds, so the
   * inline copy is the one an assertion can rely on.
   */
  error: '[data-test="text-login-error"]',
} as const;
