/**
 * The GUI and Support cards on System > General Settings, and the Send Feedback
 * dialog the Support card's File Ticket opens.
 *
 * The other cards on the page have their own modules: `locators/localization.ts`,
 * `locators/email.ts`, and the Support card's Add/Update License in
 * `locators/ha.ts`.
 */

export const generalSettingsLocators = {
  gui: {
    /** `<tn-button [testId]="'gui-settings'">` in the card footer. */
    settings: '[data-test="button-gui-settings"]',
  },

  support: {
    /** `<tn-button [testId]="'file-ticket'">` in the card footer. Labelled "File Ticket" or "Send Feedback". */
    fileTicket: '[data-test="button-file-ticket"]',
  },

  /** `<tn-dialog-shell testId="feedback-dialog">`, raised by File Ticket. */
  feedbackDialog: {
    /** What to wait on before acting on it. */
    title: '[data-test="dialog-title-feedback-dialog"]',
    /** The shell's own ✕ in the header. Closes without sending anything. */
    close: '[data-test="button-close-feedback-dialog"]',
  },
} as const;
