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
} as const;
