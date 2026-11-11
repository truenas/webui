/**
 * The Syslog card on System > Advanced Settings (static `text` readouts, value only), and its form. Form controls
 * fall back to their `formControlName`, including each server's Host and Transport in the form array, with no
 * index: two servers would both be `input-host`, so the specs only ever add one.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's values for `sysloglevel`. */
export type SyslogLevel
  = | 'F_EMERG' | 'F_ALERT' | 'F_CRIT' | 'F_ERR' | 'F_WARNING' | 'F_NOTICE' | 'F_INFO' | 'F_DEBUG';

/**
 * What the card and the Level select show for each level. The option ids are
 * keyed on these labels, not on the values.
 */
export const syslogLevelLabels: Record<SyslogLevel, string> = {
  F_EMERG: 'Emergency',
  F_ALERT: 'Alert',
  F_CRIT: 'Critical',
  F_ERR: 'Error',
  F_WARNING: 'Warning',
  F_NOTICE: 'Notice',
  F_INFO: 'Info',
  F_DEBUG: 'Debug',
};

/** Middleware's values for a server's `transport`, which are also the labels the select shows. */
export type SyslogTransport = 'UDP' | 'TCP' | 'TLS';

export const syslogLocators = {
  card: {
    /** `Enabled` or `Disabled`. */
    useFqdn: '[data-test="text-syslog-use-fqdn"]',
    /** The level's label. */
    level: '[data-test="text-syslog-level"]',
    /** `<host> (<transport>)` for each server, comma-separated, or `None`. */
    servers: '[data-test="text-syslog-servers"]',
    /** `Yes` or `No`. */
    includeAuditLogs: '[data-test="text-syslog-include-audit-logs"]',
    /** `<tn-button [testId]="['syslog', 'configure']">` in the card footer. */
    configure: '[data-test="button-syslog-configure"]',
  },

  form: {
    useFqdn: '[data-test="checkbox-fqdn-syslog"]',
    level: '[data-test="select-sysloglevel"]',
    levelOption: (level: SyslogLevel): string => (
      `[data-test="option-sysloglevel-${kebabTestSegment(syslogLevelLabels[level])}"]`
    ),
    /** Shown only while there are fewer than two servers. */
    addServer: '[data-test="button-add-server"]',
    /** The first server's Host. See the note above on why there is no index. */
    host: '[data-test="input-host"]',
    /** The first server's Transport, UDP for a newly added server. */
    transport: '[data-test="select-transport"]',
    transportOption: (transport: SyslogTransport): string => (
      `[data-test="option-transport-${kebabTestSegment(transport)}"]`
    ),
    /**
     * The first server's TLS Certificate, shown only while its transport is TLS.
     * Required then, so Save stays disabled until one is picked.
     */
    tlsCertificate: '[data-test="select-tls-certificate"]',
    /** By the certificate's name, which is how `system.advanced.syslog_certificate_choices` labels it. */
    tlsCertificateOption: (name: string): string => (
      `[data-test="option-tls-certificate-${kebabTestSegment(name)}"]`
    ),
    /** Remove on the first server. This one is indexed, from 1. */
    removeFirstServer: '[data-test="button-remove-server-1"]',
    includeAuditLogs: '[data-test="checkbox-syslog-audit"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
