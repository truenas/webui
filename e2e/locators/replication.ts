/**
 * The Replication card on System > Advanced Settings, and its form.
 *
 * The card has one readout, tagged `tnTestIdType="text"`, so its id is static.
 * It holds the limit alone, without its label, and reads `–` when there is none.
 *
 * The form is built by `ix-form-renderer` from `replication-settings.form-config.ts`,
 * so the field's id is its control name through the library normalizer — see
 * `locators/tunable.ts`.
 */
export const replicationLocators = {
  card: {
    /** The limit, or `–` when there is none. */
    tasksLimit: '[data-test="text-replication-tasks-limit"]',
    /** `<tn-button [testId]="['replication', 'configure']">` in the card footer. */
    configure: '[data-test="button-replication-configure"]',
  },

  form: {
    /** Empty when there is no limit. */
    tasksLimit: '[data-test="input-max-parallel-replication-tasks"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
