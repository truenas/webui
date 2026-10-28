/**
 * The Services page under System, and the SSH, FTP, SNMP, UPS, SMB, NFS and WebShare forms it opens.
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
export type ServiceKey = 'ssh' | 'ftp' | 'snmp' | 'ups' | 'cifs' | 'nfs' | 'webshare' | 'iscsitarget' | 'nvmet';

/** The page's name for each, as `serviceNames` in `src/app/enums/service-name.enum.ts` has it. */
const displayNames: Record<ServiceKey, string> = {
  ssh: 'SSH',
  ftp: 'FTP',
  snmp: 'SNMP',
  ups: 'UPS',
  cifs: 'SMB',
  nfs: 'NFS',
  webshare: 'WebShare',
  iscsitarget: 'iSCSI',
  nvmet: 'NVMe-oF',
};

/** `uniqueRowTag` in `services.component.ts`, which drops dots from the display name. */
const displayRowTag = (service: ServiceKey): string => (
  kebabTestSegment(`service-${displayNames[service].replace(/\./g, '')}`)
);

/** `uniqueRowTag` in `service-actions-cell` and `service-status-cell`, from the middleware name. */
const middlewareRowTag = (service: ServiceKey): string => `service-${kebabTestSegment(service)}`;

/**
 * The Start Automatically switch: `[testId]="['Start Automatically', uniqueRowTag(row), 'row-toggle']"`,
 * and `tn-slide-toggle` puts its `toggle-` type in front.
 */
const startAutomaticallyToggle = (service: ServiceKey): string => (
  `[data-test="toggle-start-automatically-${displayRowTag(service)}-row-toggle"]`
);

/** A `tn-select` option id: the control name, then the option's label through the library normalizer. */
const option = (control: string, label: string): string => `[data-test="option-${control}-${kebabTestSegment(label)}"]`;

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
    /** The Start Automatically switch. Clicking it flips the setting. */
    startAutomatically: startAutomaticallyToggle,
    /**
     * The checkbox inside {@link startAutomatically}. `tn-slide-toggle` puts its id on
     * the `<label>`, which has no disabled state, so a lock is read off the input.
     */
    startAutomaticallyInput: (service: ServiceKey): string => (
      `${startAutomaticallyToggle(service)} input[type="checkbox"]`
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
    /**
     * Rendered only on an HA-licensed system, and locked while the minimum
     * protocol is SMB1 or a Legacy or Multi-protocol share exists.
     */
    statefulFailover: '[data-test="checkbox-stateful-failover"]',
    fileMask: '[data-test="input-filemask"]',
    dirMask: '[data-test="input-dirmask"]',
    /**
     * Administrators Group, `ix-group-combobox [testId]="'admin-group'"` under Other Options: an
     * autocomplete over every group, the domain's included. Clicking the option commits it.
     */
    adminGroup: '[data-test="autocomplete-admin-group"]',
    adminGroupOption: (group: string): string => `[data-test="option-admin-group-${kebabTestSegment(group)}"]`,
  },

  /** `service-nfs.component.html`. */
  nfsForm: {
    /** "Calculate number of threads dynamically". Ticked, it hides {@link servers}. */
    serversAuto: '[data-test="checkbox-servers-auto"]',
    /** "Specify number of threads manually", rendered only while {@link serversAuto} is unticked. */
    servers: '[data-test="input-servers"]',
    v4Domain: '[data-test="input-v4-domain"]',
    v4Krb: '[data-test="checkbox-v4-krb"]',
    mountdPort: '[data-test="input-mountd-port"]',
    /** The field around {@link mountdPort}, `testId="mountd-port"`, which holds its error text. */
    mountdPortField: '[data-test="form-field-mountd-port"]',
    rpcstatdPort: '[data-test="input-rpcstatd-port"]',
    rpclockdPort: '[data-test="input-rpclockd-port"]',
    allowNonroot: '[data-test="checkbox-allow-nonroot"]',
    userdManageGids: '[data-test="checkbox-userd-manage-gids"]',
  },

  /** `service-ups.component.html`. */
  upsForm: {
    identifier: '[data-test="input-identifier"]',
    /** The field around {@link identifier}, `testId="identifier"`, which holds its error text. */
    identifierField: '[data-test="form-field-identifier"]',
    mode: '[data-test="select-mode"]',
    modeMaster: '[data-test="option-mode-master"]',
    modeSlave: '[data-test="option-mode-slave"]',

    /** Rendered only in Slave mode. */
    remoteHost: '[data-test="input-remotehost"]',
    remotePort: '[data-test="input-remoteport"]',

    /**
     * Rendered only in Master mode. A `tn-autocomplete` with `requireSelection`:
     * typing narrows the list and only clicking a row commits a value. Its rows
     * are keyed by label, which is the model and the driver name, e.g.
     * `APC Smart-UPS (usbhid-ups, USB)`.
     */
    driver: '[data-test="autocomplete-driver"]',
    driverOptions: '[data-test^="option-driver-"]',
    /** A `tn-autocomplete` with `allowCustomValue`: typed text is committed on blur. */
    port: '[data-test="autocomplete-port"]',

    monitorUser: '[data-test="input-monuser"]',
    monitorPassword: '[data-test="input-monpwd"]',
    shutdownMode: '[data-test="select-shutdown"]',
    shutdownOnBattery: '[data-test="option-shutdown-ups-goes-on-battery"]',
    shutdownTimer: '[data-test="input-shutdowntimer"]',
  },

  webshareForm: {
    /** Enable TrueSearch. Locked off unless TrueSearch is licensed and TrueNAS Connect is configured. */
    search: '[data-test="checkbox-search"]',
    /** The field around {@link search}. Its hint names the condition that keeps the box locked. */
    searchField: '[data-test="form-field-search"]',
    /** The trigger shows the chosen option's label: `Disabled`, `Enabled` or `Required`. */
    passkey: '[data-test="select-passkey"]',
    /** By the label `webSharePasskeyLabels` gives it. */
    passkeyOption: (label: string): string => `[data-test="option-passkey-${kebabTestSegment(label)}"]`,
    mcpEnabled: '[data-test="checkbox-mcp-enabled"]',
    /**
     * Rendered only while MCP is on, and then only when Directory Services
     * offers login groups to choose from as well as `truenas_webshare`.
     */
    mcpAllowedGroups: '[data-test="select-mcp-allowed-groups"]',
    /** Rendered only while MCP is on. */
    mcpAllowWrite: '[data-test="checkbox-mcp-allow-write"]',
  },

  /** `<tn-button [testId]="'save'">` on the side panel container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
