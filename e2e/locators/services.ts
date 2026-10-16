/**
 * The Services page under System, and the SSH, FTP, SNMP and SMB forms it opens.
 *
 * Every id on a row is keyed on a row tag of `service-<name>`, built from one of
 * two names. The page builds the `<tr>` and its Status cell from the display
 * name (`SMB`, via `serviceNames`); the start, stop and edit buttons build it
 * from the middleware name (`cifs`). The two agree for SSH, FTP and SNMP and differ
 * for SMB, so each id below uses the tag its own template builds.
 *
 * The forms are hand-written templates whose controls fall back to their
 * `formControlName`, so the field ids read like the API's own keys.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's name for each service the specs drive. */
export type ServiceKey = 'ssh' | 'ftp' | 'snmp' | 'cifs';

/** What `serviceNames` shows for each, which is what the page's own row tag is built from. */
const displayNames: Record<ServiceKey, string> = {
  ssh: 'SSH',
  ftp: 'FTP',
  snmp: 'SNMP',
  cifs: 'SMB',
};

/** `uniqueRowTag` in `services.component.ts`: the display name. */
const displayRowTag = (service: ServiceKey): string => `service-${kebabTestSegment(displayNames[service])}`;

/** `uniqueRowTag` in the status and actions cells: the middleware name. */
const serviceRowTag = (service: ServiceKey): string => `service-${kebabTestSegment(service)}`;

/** A `tn-select` option id: the control name, then the option's label through the library normalizer. */
const option = (control: string, label: string): string => `[data-test="option-${control}-${kebabTestSegment(label)}"]`;

export const servicesLocators = {
  row: {
    /**
     * The Status cell: `[tnTestId]="['Status', uniqueRowTag(row), 'row-state']"`
     * with `tnTestIdType="text"`. It holds the state's label (`Running`,
     * `Stopped`) beside the start or stop button.
     */
    status: (service: ServiceKey): string => `[data-test="text-status-${displayRowTag(service)}-row-state"]`,
    /** Shown only while the service is stopped. Starts it with no dialog. */
    start: (service: ServiceKey): string => `[data-test="button-${serviceRowTag(service)}-start-service"]`,
    /** Shown only while the service is running. Raises a confirmation first. */
    stop: (service: ServiceKey): string => `[data-test="button-${serviceRowTag(service)}-stop-service"]`,
    /** The pencil in the actions cell. Opens the service's form in the side panel. */
    edit: (service: ServiceKey): string => `[data-test="button-${serviceRowTag(service)}-edit-service"]`,
  },

  sshForm: {
    port: '[data-test="input-tcpport"]',
    passwordAuth: '[data-test="checkbox-passwordauth"]',
    tcpForwarding: '[data-test="checkbox-tcpfwd"]',
  },

  ftpForm: {
    port: '[data-test="input-port"]',
    clients: '[data-test="input-clients"]',
    connections: '[data-test="input-ipconnections"]',
    loginAttempts: '[data-test="input-loginattempt"]',
    notransferTimeout: '[data-test="input-timeout-notransfer"]',
    timeout: '[data-test="input-timeout"]',
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

  smbForm: {
    netbiosName: '[data-test="input-netbiosname"]',
    workgroup: '[data-test="input-workgroup"]',
    description: '[data-test="input-description"]',
    minimumProtocol: '[data-test="select-minimum-protocol"]',
    /** By the label `smbMinProtocolLabels` gives it, e.g. `SMB3 – modern clients only`. */
    minimumProtocolOption: (label: string): string => option('minimum-protocol', label),
    ntlmv1Auth: '[data-test="checkbox-ntlmv1-auth"]',

    /**
     * The footer's Advanced Settings toggle. The SMB form passes
     * `testId: 'toggle-advanced-settings'` to `advancedModeFooterAction`, where
     * the other service forms keep the default `toggle-advanced-options`. Other
     * Options, everything below, is not rendered until it is on.
     */
    advancedToggle: '[data-test="button-toggle-advanced-settings"]',
    unixCharset: '[data-test="select-unixcharset"]',
    /** By the name `smb.unixcharset_choices` offers, which is also its label. */
    unixCharsetOption: (label: string): string => option('unixcharset', label),
    encryption: '[data-test="select-encryption"]',
    /** By the label `smbEncryptionLabels` gives it. */
    encryptionOption: (label: string): string => option('encryption', label),
    /**
     * The field around {@link encryption}: its label, the selected option, and
     * once middleware has refused the save, its reason. The selected label can
     * itself mention SMB1, so read the reason by its wording, not by that word.
     */
    encryptionField: '[data-test="form-field-encryption"]',
    debug: '[data-test="checkbox-debug"]',
    syslog: '[data-test="checkbox-syslog"]',
    multichannel: '[data-test="checkbox-multichannel"]',
    fileMask: '[data-test="input-filemask"]',
    dirMask: '[data-test="input-dirmask"]',
  },

  /** `<tn-button [testId]="'save'">` on the side panel container. */
  save: '[data-test="button-save"]',
} as const;
