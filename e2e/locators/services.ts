/**
 * The Services page under System, and the SSH, FTP, SNMP and WebShare forms it opens.
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
export type ServiceKey = 'ssh' | 'ftp' | 'snmp' | 'cifs' | 'webshare' | 'iscsitarget' | 'nvmet';

/** The page's name for each, as `serviceNames` in `src/app/enums/service-name.enum.ts` has it. */
const displayNames: Record<ServiceKey, string> = {
  ssh: 'SSH',
  ftp: 'FTP',
  snmp: 'SNMP',
  cifs: 'SMB',
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
