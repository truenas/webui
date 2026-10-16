/**
 * The Services page under System, and the SSH, FTP and WebShare forms it opens.
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
export type ServiceKey = 'ssh' | 'ftp' | 'webshare';

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
} as const;
