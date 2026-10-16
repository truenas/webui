/**
 * The Services page under System, and the SSH, FTP and SNMP forms it opens.
 *
 * Every id on a row is keyed on a row tag of `service-<name>`, and two names are
 * in play. The page builds the tag from the display name (`SMB`) for the `<tr>`,
 * the Status cell and the Start Automatically switch; the status and actions
 * cells build it from the middleware name (`cifs`) for the start, stop and edit
 * buttons. They agree only where the two names do, as for `ssh` and `ftp`.
 *
 * The forms are hand-written templates whose controls fall back to their
 * `formControlName`, so the field ids read like the API's own keys.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's name for each service the specs drive. */
export type ServiceKey = 'ssh' | 'ftp' | 'snmp' | 'cifs' | 'iscsitarget' | 'nvmet';

/** The page's name for each, as `serviceNames` in `src/app/enums/service-name.enum.ts` has it. */
const displayNames: Record<ServiceKey, string> = {
  ssh: 'SSH',
  ftp: 'FTP',
  snmp: 'SNMP',
  cifs: 'SMB',
  iscsitarget: 'iSCSI',
  nvmet: 'NVMe-oF',
};

/** `uniqueRowTag` in `services.component.ts`, which drops dots from the display name. */
const displayRowTag = (service: ServiceKey): string => (
  kebabTestSegment(`service-${displayNames[service].replace(/\./g, '')}`)
);

/** `uniqueRowTag` in `service-actions-cell` and `service-status-cell`, from the middleware name. */
const middlewareRowTag = (service: ServiceKey): string => `service-${kebabTestSegment(service)}`;

export const servicesLocators = {
  /** The page header's `ix-basic-search`. It filters the list on the display name. */
  search: '[data-test="input-search"]',

  row: {
    /** The `<tr>`, from the table's `[rowTestId]`. */
    row: (service: ServiceKey): string => `[data-test="row-${displayRowTag(service)}"]`,
    /**
     * The Status cell: `[tnTestId]="['Status', uniqueRowTag(row), 'row-state']"`
     * with `tnTestIdType="text"`. It holds the state's label (`Running`,
     * `Stopped`) beside the start or stop button.
     */
    status: (service: ServiceKey): string => `[data-test="text-status-${displayRowTag(service)}-row-state"]`,
    /**
     * The Start Automatically switch: `[testId]="['Start Automatically', uniqueRowTag(row), 'row-toggle']"`,
     * and `tn-slide-toggle` puts its `toggle-` type in front.
     */
    startAutomatically: (service: ServiceKey): string => (
      `[data-test="toggle-start-automatically-${displayRowTag(service)}-row-toggle"]`
    ),
    /** Shown only while the service is stopped. Starts it with no dialog. */
    start: (service: ServiceKey): string => `[data-test="button-${middlewareRowTag(service)}-start-service"]`,
    /** Shown only while the service is running. Raises a confirmation first. */
    stop: (service: ServiceKey): string => `[data-test="button-${middlewareRowTag(service)}-stop-service"]`,
    /**
     * The pencil in the actions cell. Opens the service's form in the side panel —
     * for iSCSI and NVMe-oF, their global configuration instead.
     */
    edit: (service: ServiceKey): string => `[data-test="button-${middlewareRowTag(service)}-edit-service"]`,
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

  /** `service-snmp.component.html`. */
  snmpForm: {
    location: '[data-test="input-location"]',
    contact: '[data-test="input-contact"]',
    community: '[data-test="input-community"]',
    /**
     * Auxiliary Parameters. A multiline `tn-input` renders a `textarea`, so the
     * id is `textarea-*`, not `input-*` — see `locators/api-keys.ts`.
     */
    options: '[data-test="textarea-options"]',
    zilstat: '[data-test="checkbox-zilstat"]',

    /** SNMP v3 Support. Every field below it is rendered only while it is ticked. */
    v3: '[data-test="checkbox-v3"]',
    v3Username: '[data-test="input-v3-username"]',
    v3AuthType: '[data-test="select-v3-authtype"]',
    v3AuthTypeSha: '[data-test="option-v3-authtype-sha"]',
    v3Password: '[data-test="input-v3-password"]',
    /** The field around {@link v3Password}, `testId="v3-password"`, which holds its error text. */
    v3PasswordField: '[data-test="form-field-v3-password"]',
    v3PrivProto: '[data-test="select-v3-privproto"]',
    v3PrivProtoAes: '[data-test="option-v3-privproto-aes"]',
    v3PrivPassphrase: '[data-test="input-v3-privpassphrase"]',
  },

  /** `<tn-button [testId]="'save'">` on the side panel container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
