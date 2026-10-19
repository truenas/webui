/**
 * NVMe-oF — the NVMe-oF Subsystems card on the Shares dashboard, the Add Subsystem
 * form it opens, the subsystem details page and its three association cards, the
 * host form, and the global configuration.
 *
 * Derived from the templates rather than read off a running appliance; see
 * `signin.ts` for the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * What tells one row of the card from another: `nvmeof-subsys-<name>`.
 *
 * Built with `rowTagPair`'s `uniqueRowTag`, which is `convertStringToId` alone, so
 * unlike the iSCSI card a letter/digit boundary is NOT split: `e2e` stays `e2e`.
 * The row, the Name cell and the action buttons all use it. The Namespaces, Ports
 * and Hosts cells use `cellRowTag` (lodash) instead, and nothing here reads them.
 */
const cardRowTag = (name: string): string => kebabTestSegment(`nvmeof-subsys-${name}`);

/**
 * A port's segments as `normalizeTestIdParts` runs them — each through lodash, so
 * `0.0.0.0` becomes `0-0-0-0` and `TCP` becomes `tcp`.
 */
const portSegments = (port: { address: string; port: number }): string => (
  ['tcp', port.address, port.port].map((part) => legacyKebabTestSegment(part)).join('-')
);

/**
 * A row of the Manage Ports dialog: `toUniqueRowTag('port-<trtype>-<addr>-<svcid>')`,
 * lodash over the whole tag, so `0.0.0.0:4493` is `port-tcp-0-0-0-0-4493`.
 */
const managedPortRowTag = (port: { address: string; port: number }): string => (
  legacyKebabTestSegment(`port-tcp-${port.address}-${port.port}`)
);

/**
 * A row of the Manage Hosts dialog: `toUniqueRowTag('host-' + hostnqn)`. Lodash splits
 * a letter/digit boundary, so `e2e` in an NQN comes out as `e-2-e`.
 */
const managedHostRowTag = (hostnqn: string): string => legacyKebabTestSegment(`host-${hostnqn}`);

export const nvmeOfLocators = {
  card: {
    /** "Add" in the card's footer — `testId="nvme-of-share-add"`. Opens the Add Subsystem form. */
    add: '[data-test="button-nvme-of-share-add"]',

    /** The card's title, a link to the full NVMe-oF page. */
    openFullPage: '[data-test="link-nvme-of-open-in-new"]',

    row: (name: string): string => `[data-test="row-${cardRowTag(name)}"]`,

    /** The Name cell, an `ix-subsystem-name-cell` tagged at the call site. */
    name: (name: string): string => `[data-test="text-name-${cardRowTag(name)}-row-text"]`,

    /** The row's action menu trigger. View and Delete are two actions, so they sit in a menu. */
    rowMenu: (name: string): string => `[data-test="button-${cardRowTag(name)}-more-action"]`,

    /** View, inside that menu: routes to `/sharing/nvme-of/<name>`. */
    rowMenuView: (name: string): string => (
      `[data-test="button-${cardRowTag(name)}-more-action-mdi-eye-row-action"]`
    ),

    /** Delete, inside that menu: opens the delete-subsystem dialog. */
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${cardRowTag(name)}-more-action-mdi-delete-row-action"]`
    ),
  },

  deleteDialog: {
    /**
     * "Force". Middleware refuses to delete a subsystem that still has namespaces or
     * ports unless this is ticked, and then deletes them with it.
     */
    force: '[data-test="checkbox-force"]',
    delete: '[data-test="button-delete"]',
  },

  addForm: {
    /** Step 1, What To Share. */
    name: '[data-test="input-name"]',
    /** "Add" in the Namespaces block. Opens a second side panel over this one. */
    addNamespace: '[data-test="button-add-namespace"]',
    next: '[data-test="button-next"]',

    /** Step 2, Access. Ticked by default; unticking it shows the Allowed Hosts block. */
    allowAnyHost: '[data-test="checkbox-allow-any-host"]',

    save: '[data-test="button-save"]',
  },

  namespaceForm: {
    /**
     * The zvol picker. The form opens on the Zvol type, and `ix-explorer` renders a
     * `tn-file-picker` whose inner `<input>` takes the control name. It takes a
     * `/dev/zvol/…` path, which the form rewrites to middleware's `zvol/…`.
     */
    devicePath: '[data-test="input-device-path"]',

    /**
     * The side panel's footer Save. The same id as the Add Subsystem form's own Save,
     * so when the namespace panel is stacked over that form a flow takes the last match.
     */
    save: '[data-test="button-save"]',
  },

  /** The menus behind the Add buttons on the Ports and Hosts cards, and in the add form. */
  addPort: '[data-test="button-add-port"]',
  addPortOption: (port: { address: string; port: number }): string => (
    `[data-test="button-add-port-${portSegments(port)}"]`
  ),

  addHost: '[data-test="button-add-host"]',
  /** An existing host in the Add menu, by its NQN through lodash (`hostTestIdSlug`). */
  addHostOption: (hostnqn: string): string => `[data-test="button-add-host-${legacyKebabTestSegment(hostnqn)}"]`,
  /** "Create New" in that menu. Opens the host form, and adds the host it saves. */
  createNewHost: '[data-test="button-create-new-host"]',

  /** "Manage Ports" in the Ports card's Add menu. Opens the Manage Ports dialog. */
  managePorts: '[data-test="button-manage-ports"]',
  /** "Manage Hosts" in the Associated Hosts card's Add menu. Opens the Manage Hosts dialog. */
  manageHosts: '[data-test="button-manage-hosts"]',

  /**
   * The Manage Ports and Manage Hosts dialogs. Both are `<tn-dialog-shell testId="dialog">`,
   * so they share the shell's ids; only one is ever open at a time.
   */
  manageDialog: {
    title: '[data-test="dialog-title-dialog"]',
    /** The shell's own ✕. */
    close: '[data-test="button-close-dialog"]',
  },

  managePortsDialog: {
    row: (port: { address: string; port: number }): string => `[data-test="row-${managedPortRowTag(port)}"]`,
    usedInSubsystems: (port: { address: string; port: number }): string => (
      `[data-test="text-used-in-subsystems-${managedPortRowTag(port)}-row-text"]`
    ),
    /** The row's pencil. Opens the port form in a side panel over the dialog. */
    edit: (port: { address: string; port: number }): string => (
      `[data-test="button-${managedPortRowTag(port)}-mdi-pencil-row-action"]`
    ),
    /** The row's bin. Opens the port-or-host delete dialog. */
    delete: (port: { address: string; port: number }): string => (
      `[data-test="button-${managedPortRowTag(port)}-mdi-delete-row-action"]`
    ),
  },

  manageHostsDialog: {
    row: (hostnqn: string): string => `[data-test="row-${managedHostRowTag(hostnqn)}"]`,
    description: (hostnqn: string): string => (
      `[data-test="text-description-${managedHostRowTag(hostnqn)}-row-text"]`
    ),
    hasAuthentication: (hostnqn: string): string => (
      `[data-test="text-has-host-authentication-${managedHostRowTag(hostnqn)}-row-yesno"]`
    ),
    /** The row's pencil. Opens the host form in a side panel over the dialog. */
    edit: (hostnqn: string): string => `[data-test="button-${managedHostRowTag(hostnqn)}-mdi-pencil-row-action"]`,
    /** The row's bin. Opens the port-or-host delete dialog. */
    delete: (hostnqn: string): string => (
      `[data-test="button-${managedHostRowTag(hostnqn)}-mdi-delete-row-action"]`
    ),
  },

  /** What both Manage dialogs raise before deleting a port or a host. */
  portOrHostDeleteDialog: {
    title: '[data-test="dialog-title-subsystem-port-ot-host-delete"]',
    /** "{type} is currently in use by the following subsystems:". Rendered only when some do. */
    inUseMessage: '[data-test="text-in-use-message"]',
    /** One subsystem in that list, by name. */
    subsystemInUse: (name: string): string => `[data-test="text-subsystem-in-use-${kebabTestSegment(name)}"]`,
    /**
     * Labelled "Delete Anyway" while the list is shown, and then deletes with `force`;
     * "Delete" otherwise. The only `button-delete` on screen while this dialog is up.
     */
    delete: '[data-test="button-delete"]',
    cancel: '[data-test="button-cancel"]',
  },

  /** The port form, as Edit in Manage Ports opens it. */
  portForm: {
    /** The service id. A number input, though the control holds what middleware stored. */
    serviceId: '[data-test="input-addr-trsvcid"]',
    save: '[data-test="button-save"]',
  },

  /** "No" on the "Start NVMe-oF Service" dialog the add form raises while the service is stopped. */
  declineStartService: '[data-test="button-do-not-start"]',

  details: {
    /** The Details card's Name readout. Which subsystem the page is showing. */
    name: '[data-test="text-name"]',

    /** "Add" on the Namespaces card. Opens the namespace form, which saves on its own. */
    addNamespace: '[data-test="button-add-namespace"]',
    /** A namespace's delete button, by its `device_path` through lodash. */
    deleteNamespace: (devicePath: string): string => (
      `[data-test="button-delete-namespace-${legacyKebabTestSegment(devicePath)}"]`
    ),
    /** The delete-namespace dialog's Delete. A zvol namespace offers no "delete the file" box. */
    confirmDeleteNamespace: '[data-test="button-delete"]',

    /** Unlinks a port from this subsystem. No confirmation; the port itself stays. */
    removePort: (port: { address: string; port: number }): string => (
      `[data-test="button-remove-port-association-${portSegments(port)}"]`
    ),

    /** A host listed on the Associated Hosts card. */
    host: (hostnqn: string): string => `[data-test="text-host-${legacyKebabTestSegment(hostnqn)}"]`,
    /** Unlinks a host from this subsystem. No confirmation; the host itself stays. */
    removeHost: (hostnqn: string): string => (
      `[data-test="button-remove-host-association-${legacyKebabTestSegment(hostnqn)}"]`
    ),
  },

  hostForm: {
    hostnqn: '[data-test="input-hostnqn"]',
    /** `<tn-form-field testId="hostnqn">` around {@link hostnqn}, which holds its error text. */
    hostnqnField: '[data-test="form-field-hostnqn"]',
    description: '[data-test="input-description"]',
    requireAuthentication: '[data-test="checkbox-require-host-authentication"]',
    /** "Generate Key" under Key For Host To Present. Enabled once a Host NQN is typed. */
    generateHostKey: '[data-test="button-generate-key-host"]',
    /** That key. A multiline `tn-input`, so a `<textarea>` typed `textarea`. */
    hostKey: '[data-test="textarea-dhchap-key"]',
    /** "Generate Key" under Key For TrueNAS To Present, generated from the global base NQN. */
    generateTrueNasKey: '[data-test="button-generate-key-ctrl"]',
    trueNasKey: '[data-test="textarea-dhchap-ctrl-key"]',
    save: '[data-test="button-save"]',
    /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
    closePanel: '[data-test="button-close-side-panel"]',
  },

  page: {
    /** "Global Configuration" in the NVMe-oF page header. */
    globalConfiguration: '[data-test="button-global-configuration"]',
  },

  globalConfig: {
    basenqn: '[data-test="input-basenqn"]',
    /** Disabled unless the system is HA licensed. */
    ana: '[data-test="checkbox-ana"]',
    /** Disabled unless `rdma.capable_protocols` lists NVMe-oF. */
    rdma: '[data-test="checkbox-rdma"]',
    /**
     * The Implementation radios. Rendered only with the NVMe-oF SPDK entitlement;
     * the base keeps the legacy `radio-button-*` spelling.
     */
    spdk: '[data-test="radio-button-kernel-spdk-userspace"]',
    save: '[data-test="button-save"]',
  },
} as const;
