/**
 * The Self-Encrypting Drive card on System > Advanced Settings, and its form.
 *
 * The card's one readout is tagged `tnTestIdType="text"`, so its id is static.
 * Its Configure button says `encrypted`, not `encrypting`.
 *
 * The form is built by `ix-form-renderer` from
 * `self-encrypting-drive.form-config.ts`, so every field's id is its control
 * name. The library normalizer keeps `passwd2` together.
 */
export const selfEncryptingDriveLocators = {
  card: {
    /** One `*` per character of the global SED password, or `–` when it is empty. */
    password: '[data-test="text-sed-password"]',
    /** `<tn-button [testId]="['self-encrypted-drive', 'configure']">` in the card footer. */
    configure: '[data-test="button-self-encrypted-drive-configure"]',
  },

  form: {
    password: '[data-test="input-sed-passwd"]',
    /** Confirm SED Password. */
    confirmPassword: '[data-test="input-sed-passwd2"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
