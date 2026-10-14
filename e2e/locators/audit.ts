/**
 * The Audit card on System > Advanced Settings, and its form.
 *
 * The card has no rows: each setting is a readout tagged `tnTestIdType="text"`,
 * so its id is static. Each holds a single value, without its label, and reads
 * `None` when the value is 0.
 *
 * The form is built by `ix-form-renderer` from `audit.form-config.ts`, so every
 * field's id is its control name through the library normalizer — see
 * `locators/tunable.ts`.
 */
export const auditLocators = {
  card: {
    /** `<n> days`. */
    retention: '[data-test="text-audit-retention"]',
    /** `<n> GiB`, or `None`. */
    reservation: '[data-test="text-audit-reservation"]',
    /** `<n> GiB`, or `None`. */
    quota: '[data-test="text-audit-quota"]',
    /** `<n>%`. */
    quotaFillWarning: '[data-test="text-audit-quota-fill-warning"]',
    /** `<n>%`. */
    quotaFillCritical: '[data-test="text-audit-quota-fill-critical"]',
    /** `<tn-button [testId]="['audit', 'configure']">` in the card footer. */
    configure: '[data-test="button-audit-configure"]',
  },

  form: {
    retention: '[data-test="input-retention"]',
    reservation: '[data-test="input-reservation"]',
    quota: '[data-test="input-quota"]',
    quotaFillWarning: '[data-test="input-quota-fill-warning"]',
    quotaFillCritical: '[data-test="input-quota-fill-critical"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
