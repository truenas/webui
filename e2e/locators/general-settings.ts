/**
 * The GUI and Support cards on System > General Settings, the GUI card's
 * Settings form, and the Send Feedback dialog the Support card's File Ticket
 * opens.
 *
 * The other cards on the page have their own modules: `locators/localization.ts`,
 * `locators/email.ts`, and the Support card's Add/Update License in
 * `locators/ha.ts`.
 */
import { kebabTestSegment } from './test-id';

export const generalSettingsLocators = {
  gui: {
    /** `<tn-button [testId]="'gui-settings'">` in the card footer. */
    settings: '[data-test="button-gui-settings"]',
    /** The certificate's name, or `None`. */
    sslCertificate: '[data-test="text-gui-ssl-certificate"]',
    /** The protocols, joined with `, `. */
    httpsProtocols: '[data-test="text-gui-https-protocols"]',
    /** `Enabled` or `Disabled`. A `null` (never chosen) shows as `Disabled`. */
    usageCollection: '[data-test="text-gui-usage-collection"]',
    /** `Enabled` or `Disabled`. */
    consoleMessages: '[data-test="text-gui-console-messages"]',
  },

  /**
   * The GUI card's Settings form, in the side panel.
   *
   * Each control's `testId` is its `formControlName`, and the library kebab-cases
   * it: `ui_certificate` emits `select-ui-certificate`. Options are keyed by their
   * label, which is the value side of the `system.general.*_choices` map.
   */
  guiForm: {
    /** GUI SSL Certificate. Labelled by certificate name. */
    certificate: '[data-test="select-ui-certificate"]',
    certificateOption: (name: string): string => `[data-test="option-ui-certificate-${kebabTestSegment(name)}"]`,
    certificateOptions: '[data-test^="option-ui-certificate-"]',
    /** Web Interface IPv4 Address, a multiple select. */
    address: '[data-test="select-ui-address"]',
    addressOptions: '[data-test^="option-ui-address-"]',
    /**
     * Web Interface IPv6 Address, a multiple select.
     *
     * No trailing dash: `::` kebab-cases to nothing, so its option id may be the
     * bare prefix.
     */
    v6address: '[data-test="select-ui-v6address"]',
    v6addressOptions: '[data-test^="option-ui-v6address"]',
    /** HTTP Port. */
    port: '[data-test="input-ui-port"]',
    /** `<tn-form-field testId="ui-port">` around {@link port}: its label and, once refused, the reason. */
    portField: '[data-test="form-field-ui-port"]',
    /** HTTPS Protocols, a multiple select. Required. */
    httpsProtocols: '[data-test="select-ui-httpsprotocols"]',
    /** By the protocol's name: `TLSv1.3` emits `option-ui-httpsprotocols-tl-sv1-3`. */
    httpsProtocolOption: (protocol: string): string => (
      `[data-test="option-ui-httpsprotocols-${kebabTestSegment(protocol)}"]`
    ),
    httpsProtocolOptions: '[data-test^="option-ui-httpsprotocols-"]',
    usageCollection: '[data-test="checkbox-usage-collection"]',
    consoleMessages: '[data-test="checkbox-ui-consolemsg"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
    closePanel: '[data-test="button-close-side-panel"]',
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
