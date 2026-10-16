/**
 * The Services page under System, and the SSH, FTP, SNMP and NFS forms it opens.
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
export type ServiceKey = 'ssh' | 'ftp' | 'snmp' | 'nfs';

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

  /** `<tn-button [testId]="'save'">` on the side panel container. */
  save: '[data-test="button-save"]',
} as const;
