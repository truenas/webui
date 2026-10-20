/**
 * The Kernel card on System > Advanced Settings, and its form.
 *
 * The card's one readout is tagged `tnTestIdType="text"`, so its id is static.
 * The form is built by `ix-form-renderer` from `kernel.form-config.ts`, so its
 * one field's id is its control name — see `locators/console.ts`.
 */
export const kernelLocators = {
  card: {
    /** Enable Debug Kernel: `Enabled` or `Disabled`. */
    debugKernel: '[data-test="text-enable-debug-kernel"]',
    /** `<tn-button [testId]="['kernel', 'configure']">` in the card footer. */
    configure: '[data-test="button-kernel-configure"]',
  },

  form: {
    debugKernel: '[data-test="checkbox-debugkernel"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
