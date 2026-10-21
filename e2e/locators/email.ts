/**
 * The Email card on System > General Settings, and its form.
 *
 * The card's readouts are tagged `tnTestIdType="text"`, so their ids are static,
 * and each holds the value alone, without its label. From is rendered only once
 * a sender name or address is set.
 *
 * The form is a hand-written template. Every field passes a `testId` equal to its
 * `formControlName`, so the ids read like the API's own keys. Security is a
 * `tn-select` whose options are keyed on their labels. Username and Password
 * exist only while SMTP Authentication is ticked, and everything below From Name
 * only while the send method is SMTP, which is the only method a test uses: the
 * other two need a real OAuth login.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's values for `security`. */
export type MailSecurity = 'PLAIN' | 'SSL' | 'TLS';

/** What the Security select shows for each value. The option ids are keyed on these labels. */
export const mailSecurityLabels: Record<MailSecurity, string> = {
  PLAIN: 'Plain (No Encryption)',
  SSL: 'SSL (Implicit TLS)',
  TLS: 'TLS (STARTTLS)',
};

export const emailLocators = {
  card: {
    /** `SMTP`, or the OAuth provider's label. */
    sendMailMethod: '[data-test="text-email-send-mail-method"]',
    /** `<name> <address> via <server>` for SMTP. Absent while neither name nor address is set. */
    from: '[data-test="text-email-from"]',
    /** `<tn-button [testId]="'email-settings'">` in the card footer. */
    settings: '[data-test="button-email-settings"]',
  },

  form: {
    fromEmail: '[data-test="input-fromemail"]',
    fromName: '[data-test="input-fromname"]',
    outgoingServer: '[data-test="input-outgoingserver"]',
    port: '[data-test="input-port"]',
    security: '[data-test="select-security"]',
    securityOption: (security: MailSecurity): string => (
      `[data-test="option-security-${kebabTestSegment(mailSecurityLabels[security])}"]`
    ),
    smtpAuthentication: '[data-test="checkbox-smtp"]',
    /** Shown only while SMTP Authentication is ticked. */
    username: '[data-test="input-user"]',
    /** Shown only while SMTP Authentication is ticked. */
    password: '[data-test="input-pass"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    /**
     * The form's one extra footer action, `testId: 'send-test-mail'` in `footerActions`,
     * which the side panel container renders as a `tn-button` beside Save.
     */
    sendTestMail: '[data-test="button-send-test-mail"]',
  },
} as const;
