/**
 * The Services page under System, and the SSH and FTP forms it opens.
 *
 * Every id on a row is keyed on a row tag of `service-<name>`. The page builds it
 * from the display name (`SSH`) and the two cells from the middleware name
 * (`ssh`). Both normalize to the same `service-ssh`, so one helper serves both.
 *
 * The forms are hand-written templates whose controls fall back to their
 * `formControlName`, so the field ids read like the API's own keys.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's name for each service the specs drive. */
export type ServiceKey = 'ssh' | 'ftp';

const rowTag = (service: ServiceKey): string => `service-${kebabTestSegment(service)}`;

export const servicesLocators = {
  row: {
    /**
     * The Status cell: `[tnTestId]="['Status', uniqueRowTag(row), 'row-state']"`
     * with `tnTestIdType="text"`. It holds the state's label (`Running`,
     * `Stopped`) beside the start or stop button.
     */
    status: (service: ServiceKey): string => `[data-test="text-status-${rowTag(service)}-row-state"]`,
    /** Shown only while the service is stopped. Starts it with no dialog. */
    start: (service: ServiceKey): string => `[data-test="button-${rowTag(service)}-start-service"]`,
    /** Shown only while the service is running. Raises a confirmation first. */
    stop: (service: ServiceKey): string => `[data-test="button-${rowTag(service)}-stop-service"]`,
    /** The pencil in the actions cell. Opens the service's form in the side panel. */
    edit: (service: ServiceKey): string => `[data-test="button-${rowTag(service)}-edit-service"]`,
  },

  /**
   * The side panel footer's Advanced/Basic toggle on both forms. Each passes
   * `advancedModeFooterAction` no `testId`, so both get its default, the same
   * id as on the SMB and NFS share forms. The SSH form only relabels it
   * "Advanced Settings".
   */
  advancedToggle: '[data-test="button-toggle-advanced-options"]',

  sshForm: {
    port: '[data-test="input-tcpport"]',
    passwordAuth: '[data-test="checkbox-passwordauth"]',
    tcpForwarding: '[data-test="checkbox-tcpfwd"]',

    /** The rest are advanced fields, rendered only once {@link servicesLocators.advancedToggle} is on. */
    compression: '[data-test="checkbox-compression"]',
    sftpLogLevel: '[data-test="select-sftp-log-level"]',
    /** Keyed on the option's label from `helptextServiceSsh`, e.g. `Verbose`. */
    sftpLogLevelOption: (label: string): string => `[data-test="option-sftp-log-level-${kebabTestSegment(label)}"]`,
    sftpLogFacility: '[data-test="select-sftp-log-facility"]',
    sftpLogFacilityOption: (label: string): string => (
      `[data-test="option-sftp-log-facility-${kebabTestSegment(label)}"]`
    ),
    /** A multiple select. Its labels are `None` and `AES128-CBC`. */
    weakCiphers: '[data-test="select-weak-ciphers"]',
    weakCiphersOption: (label: string): string => `[data-test="option-weak-ciphers-${kebabTestSegment(label)}"]`,
  },

  ftpForm: {
    port: '[data-test="input-port"]',
    clients: '[data-test="input-clients"]',
    connections: '[data-test="input-ipconnections"]',
    loginAttempts: '[data-test="input-loginattempt"]',
    notransferTimeout: '[data-test="input-timeout-notransfer"]',
    timeout: '[data-test="input-timeout"]',

    /** The rest are advanced fields, rendered only once {@link servicesLocators.advancedToggle} is on. */
    alwaysChroot: '[data-test="checkbox-defaultroot"]',
    localUserLogin: '[data-test="checkbox-onlylocal"]',
    transferResumption: '[data-test="checkbox-resume"]',
    fxp: '[data-test="checkbox-fxp"]',
    passivePortsMin: '[data-test="input-passiveportsmin"]',
    passivePortsMax: '[data-test="input-passiveportsmax"]',
    /** The field around Maximum Passive Port: its label and, once refused, the reason. */
    passivePortsMaxField: '[data-test="form-field-passiveportsmax"]',
    /** Size inputs that take `1 MiB` and the like. The form holds bytes and saves KiB. */
    localUserUploadBandwidth: '[data-test="input-localuserbw"]',
    localUserDownloadBandwidth: '[data-test="input-localuserdlbw"]',

    tls: '[data-test="checkbox-tls"]',
    /** Rendered only while Enable TLS is ticked. Options are keyed on the certificate's name. */
    certificate: '[data-test="select-ssltls-certificate"]',
    certificateOption: (name: string): string => `[data-test="option-ssltls-certificate-${kebabTestSegment(name)}"]`,
    tlsPolicy: '[data-test="select-tls-policy"]',
    /**
     * Keyed on the option's label from `helptextServiceFtp`, e.g. `Data`.
     *
     * Two policies share an id: `Data` and `!Data` both normalize to `data`, and
     * `Ctrl + Data` and `Ctrl + !Data` to `ctrl-data`. A spec picking one of those
     * takes the first match, which is the one without the `!`.
     */
    tlsPolicyOption: (label: string): string => `[data-test="option-tls-policy-${kebabTestSegment(label)}"]`,
    tlsAllowClientRenegotiations: '[data-test="checkbox-tls-opt-allow-client-renegotiations"]',
  },

  /** `<tn-button [testId]="'save'">` on the side panel container. */
  save: '[data-test="button-save"]',
} as const;
