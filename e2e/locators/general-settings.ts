/**
 * The GUI and Support cards on System > General Settings, the GUI card's
 * Settings form, the Send Feedback dialog the Support card's File Ticket
 * opens, the System Thumbprint dialog, and the EULA page.
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

    /*
     * The licensed readouts, from `sys-info.component.html`. Each is rendered only on a licensed
     * appliance, and some only when there is something to show.
     */
    /** The label of the upper-cased `contract_type`. Absent when the license has none. */
    contractType: '[data-test="text-contract-type"]',
    /** The SUPPORT feature's date in the account's format, then "(expires in N days)". */
    expirationDate: '[data-test="text-expiration-date"]',
    /** `Enabled` or `Not Available`. Absent while Proactive Support is available and not yet set up. */
    proactiveSupport: '[data-test="text-proactive-support"]',
    /** The license's model, or `system.info`'s when the license names none. */
    model: '[data-test="text-model"]',
    /** Absent when `system.info` has no `system_serial`. */
    systemSerial: '[data-test="text-system-serial"]',
    /** The serials joined with ` / `. Absent when there are none. */
    licensedSerials: '[data-test="text-licensed-serials"]',
    /** The labels of every feature but SUPPORT, joined with `, `, or `NONE`. */
    features: '[data-test="text-features"]',
    /** `<count>× <model>` per enclosure, joined with `, `. Absent when there are none. */
    additionalHardware: '[data-test="text-additional-hardware"]',
    /** The System Thumbprint row's eye button. Not rendered on an Enterprise license. */
    viewFingerprint: '[data-test="button-view-fingerprint"]',
  },

  /** `<tn-dialog-shell testId="license-fingerprint">`, raised by the Support card's `viewFingerprint`. */
  fingerprintDialog: {
    title: '[data-test="dialog-title-license-fingerprint"]',
    /** One key of the decoded thumbprint, when it has a single value. `cpu_id` emits `cpu-id`. */
    field: (key: string): string => `[data-test="text-fingerprint-field-${kebabTestSegment(key)}"]`,
    /** One item of a key whose value is a list of two or more. */
    fieldItem: (key: string, index: number): string => (
      `[data-test="text-fingerprint-field-${kebabTestSegment(key)}-${index}"]`
    ),
    /** The answer as middleware sent it, shown when it does not decode to an object of plain values. */
    raw: '[data-test="text-fingerprint-raw"]',
    close: '[data-test="button-close"]',
  },

  /** The EULA page, `/system/support/eula`. Nothing in the sidebar links to it. */
  eula: {
    /** The `truenas.get_eula` HTML, rendered. */
    text: '[data-test="text-eula"]',
    /** Rendered only once the EULA has loaded. Links to `/system/general`. */
    backToSupport: '[data-test="button-back-to-support"]',
  },

  /** `<tn-dialog-shell testId="feedback-dialog">`, raised by File Ticket. */
  feedbackDialog: {
    /** What to wait on before acting on it. */
    title: '[data-test="dialog-title-feedback-dialog"]',
    /** The shell's own ✕ in the header. Closes without sending anything. */
    close: '[data-test="button-close-feedback-dialog"]',
  },
} as const;
