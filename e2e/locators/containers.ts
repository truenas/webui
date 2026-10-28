/**
 * The Containers page: its header, the Global Configuration form and the Map
 * User/Group IDs dialog its Configuration menu opens, the Create New Container form and its image
 * browser, the list, the Stop Options dialog, the details panel and the delete
 * dialog.
 *
 * The header is `all-containers-header.component.html`, the settings form is
 * `global-config-form.component.html` and the create form is
 * `container-form.component.html`. Both forms open in a side panel, so Save and
 * the close button belong to the panel rather than to either form.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * What tells one row of the list from another: `container-<name>`.
 *
 * `toUniqueRowTag` runs the whole tag through lodash, so a name with a
 * letter/digit boundary is split there (`e2e` becomes `e-2-e`).
 */
const rowTag = (name: string): string => legacyKebabTestSegment(`container-${name}`);

/** A row of the Map User/Group IDs dialog: `mapping-<name>`, through lodash as {@link rowTag} is. */
const idMappingRowTag = (name: string): string => legacyKebabTestSegment(`mapping-${name}`);

export const containersLocators = {
  header: {
    /** "Configuration", a `tn-button` that opens a menu rather than a page. */
    configurationMenu: '[data-test="button-configuration-menu"]',
    /** "Settings" in that menu. A `tn-menu-item`, so its id is `button-<testId>`. */
    settings: '[data-test="button-global-configuration"]',
    /** "Map User/Group IDs" in that menu, `testId="map-user-group-ids"`. Opens the dialog below. */
    mapUserGroupIds: '[data-test="button-map-user-group-ids"]',
    /** "Create New Container". Rendered once the page has read `lxc.config`. */
    createContainer: '[data-test="button-create-new-container"]',
  },

  settings: {
    /**
     * "Preferred Pool", a `tn-select` with `[allowEmpty]="true"`. Its options are
     * `container.pool_choices`, keyed by label, which is the pool's name.
     */
    preferredPool: '[data-test="select-preferred-pool"]',
    preferredPoolOption: (pool: string): string => `[data-test="option-preferred-pool-${kebabTestSegment(pool)}"]`,
    /** The `--` row `allowEmpty` puts first. The library keys it `empty`, whatever its label says. */
    preferredPoolEmpty: '[data-test="option-preferred-pool-empty"]',

    /**
     * "IPv4 Network": an `ix-ip-input-with-netmask` with `[testId]="'v4-network'"`,
     * so an address input and a prefix select beside it. The two are one stored
     * value, `<address>/<prefix>`.
     */
    v4Address: '[data-test="input-v4-network"]',
    v4Prefix: '[data-test="select-v4-network-netmask"]',
    v4PrefixOption: (bits: number): string => `[data-test="option-v4-network-netmask-${bits}"]`,
    /** The field around the IPv4 network: its label and, once refused, the reason. */
    v4Field: '[data-test="form-field-v4-network"]',

    /** "IPv6 Network", the same control with `[testId]="'v6-network'"`. */
    v6Address: '[data-test="input-v6-network"]',
  },

  /**
   * The Map User/Group IDs dialog, `map-user-group-ids-dialog.component.html`, and
   * its Add New Mapping form, `new-mapping-form.component.html`.
   *
   * `<tn-dialog-shell testId="dialog">`, so its title and ✕ carry the shell's
   * generic ids. The table and the form below it are rendered only once the
   * mappings have loaded, and both are rendered again on every reload: switching
   * Users/Groups, a Set, a Clear.
   */
  idMapping: {
    title: '[data-test="dialog-title-dialog"]',
    close: '[data-test="button-close-dialog"]',
    /** The Users / Groups switch, `<tn-button-toggle [testId]="option.value">`. */
    users: '[data-test="button-toggle-users"]',
    groups: '[data-test="button-toggle-groups"]',

    /**
     * A mapping's row and cells. The tag is `toUniqueRowTag('mapping-' + name)`, so
     * the whole of it goes through lodash and `e2e_idmap_user` is `e-2-e-idmap-user`.
     * The Host column is titled Host UID in the Users view and Host GID in the
     * Groups view, and its id follows the title.
     */
    row: (name: string): string => `[data-test="row-${idMappingRowTag(name)}"]`,
    hostUid: (name: string): string => `[data-test="text-host-uid-${idMappingRowTag(name)}-row-text"]`,
    hostGid: (name: string): string => `[data-test="text-host-gid-${idMappingRowTag(name)}-row-text"]`,
    /** The container's UID or GID: `Same` for a `DIRECT` mapping, the number otherwise. */
    containerId: (name: string): string => (
      `[data-test="text-instance-uid-or-gid-${idMappingRowTag(name)}-row-text"]`
    ),
    /**
     * "Clear mapping", `['clear-mapping', name]`. Unlike the row tag this goes
     * through the library's normalizer alone, so `e2e_idmap_user` is `e2e-idmap-user`.
     */
    clear: (name: string): string => `[data-test="button-clear-mapping-${kebabTestSegment(name)}"]`,

    /**
     * The User or Group picker, an `ix-user-combobox` / `ix-group-combobox` bound to
     * `hostUidOrGid` with no `testId`, so both fall back to the control name. Its
     * rows are keyed by the name they show.
     */
    account: '[data-test="autocomplete-host-uid-or-gid"]',
    accountOption: (name: string): string => `[data-test="option-host-uid-or-gid-${kebabTestSegment(name)}"]`,
    /** "Map to the same UID (or GID) in the container", ticked whenever the form resets. */
    mapDirectly: '[data-test="checkbox-map-directly"]',
    /** "Container UID" or "Container GID", rendered only while Map Directly is unticked. */
    containerIdInput: '[data-test="input-instance-uid-or-gid"]',
    set: '[data-test="button-set-mapping"]',
  },

  /**
   * The container form. General Info's Edit opens the same form on an existing
   * container, without Image and Pool and with the same ids for the rest.
   */
  create: {
    /** "Name", the first field of the basic form. Rendered as soon as the panel is. */
    name: '[data-test="input-name"]',
    /**
     * "Pool". Rendered in the basic form only while no preferred pool is set, which
     * the form reads from `lxc.config` as it opens.
     */
    pool: '[data-test="select-pool"]',
    /** The field around Name: its label and, once the value is refused, the reason. */
    nameField: '[data-test="form-field-name"]',
    description: '[data-test="input-description"]',
    autostart: '[data-test="checkbox-autostart"]',
    /** "Browse Catalog", which opens the image browser. The Image field beside it is read-only. */
    browseImages: '[data-test="button-browse-images"]',
    image: '[data-test="input-image"]',
    /**
     * The side panel footer's Advanced/Basic toggle. The CPU Set and Environment
     * Variables sections render only in advanced mode.
     */
    advancedOptions: '[data-test="button-advanced-options"]',
    cpuset: '[data-test="input-cpuset"]',
    /** "Shutdown Timeout (seconds)", advanced, and the field around it that shows its refusal. */
    shutdownTimeout: '[data-test="input-shutdown-timeout"]',
    shutdownTimeoutField: '[data-test="form-field-shutdown-timeout"]',
    /** "Add" under Environment Variables: `tn-form-list` names it `['add-item', label]`. */
    addEnvironmentVariable: '[data-test="button-add-item-environment-variables"]',
    /**
     * A variable row's remove control, `testId="remove-from-list"` on every
     * `tn-form-list-item`, so it picks one row only while the form has one.
     */
    removeEnvironmentVariable: '[data-test="button-remove-from-list"]',
    /**
     * One environment variable's Name and Value, scoped by the row's index. The
     * inputs fall back to `input-name` and `input-value`, and the container's own
     * Name is `input-name` as well, so the row id is what tells them apart.
     */
    environmentVariable: (index: number): { name: string; value: string } => {
      const row = `[data-test="row-environment-variable-${index}"]`;
      return {
        name: `${row} [data-test="input-name"]`,
        value: `${row} [data-test="input-value"]`,
      };
    },
  },

  /**
   * The image browser, `select-image-dialog.component.html`. Images are listed
   * one row per version, and every version of an image shares its Select id,
   * `['select-image', label]`. The label is the registry's product key, e.g.
   * `debian:bookworm:amd64:default`, so a version is picked with the Release
   * filter rather than by the Select id.
   */
  imageBrowser: {
    /** "Search Images", matched against the label. */
    search: '[data-test="input-search-query"]',
    /** The Release filter. Its options are the registry's versions, e.g. `20261016_05:24`. */
    release: '[data-test="select-release"]',
    releaseOption: (version: string): string => `[data-test="option-release-${kebabTestSegment(version)}"]`,
    selectImage: (label: string): string => `[data-test="button-select-image-${kebabTestSegment(label)}"]`,
  },

  list: {
    /** The `<tr>`, from `[rowTestId]`. Clicking it opens the container's details. */
    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,
    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,
    /** The Status cell, an `ix-container-status-cell`: `Running`, `Stopped`, … */
    status: (name: string): string => `[data-test="text-status-${rowTag(name)}-row-state"]`,
    /**
     * The row's Controls: `<tn-icon-button [testId]="[row.name, 'start']">` and the
     * like. Unlike the row tag, the name goes through the library's normalizer
     * alone, so `e2e` stays `e2e` here. Start renders while the container is
     * stopped, Restart and Stop while it is not.
     */
    start: (name: string): string => `[data-test="button-${kebabTestSegment(name)}-start"]`,
    restart: (name: string): string => `[data-test="button-${kebabTestSegment(name)}-restart"]`,
    stop: (name: string): string => `[data-test="button-${kebabTestSegment(name)}-stop"]`,
  },

  /**
   * The Stop Options dialog (`stop-options-dialog.component.html`), which the row's
   * Stop and Restart both open, `<tn-dialog-shell testId="stop-options">`.
   */
  stopOptionsDialog: {
    title: '[data-test="dialog-title-stop-options"]',
    /**
     * "Stop Method". Its options are keyed by label, and a label names the
     * operation: `Force stop immediately` from Stop, `Force restart immediately`
     * from Restart. It opens on the graceful-then-force option.
     */
    stopMethod: '[data-test="select-stop-method"]',
    stopMethodOption: (label: string): string => `[data-test="option-stop-method-${kebabTestSegment(label)}"]`,
    /** The dialog's primary button. Labelled Stop or Restart, after the operation. */
    continue: '[data-test="button-continue"]',
  },

  /**
   * The details panel's General Info card. Each readout holds its label as well
   * as its value, e.g. "Description: E2E container".
   */
  details: {
    description: '[data-test="text-description"]',
    autostart: '[data-test="text-autostart"]',
    dataset: '[data-test="text-dataset"]',
    cpuset: '[data-test="text-cpu-set"]',
    /** Opens the container form (`create` above) on this container. Its Save calls `container.update`. */
    edit: '[data-test="button-edit-container"]',
    delete: '[data-test="button-delete-container"]',
  },

  /** The details panel's Tools card, `container-tools.component.html`. */
  tools: {
    /**
     * "Shell", a `tn-list-item` with `[testId]="['link', 'open-shell']"`, written as is. Opens
     * `/containers/view/<id>/shell`. Clickable only while the container runs and the user has
     * `web_shell`; otherwise `aria-disabled="true"`, which the call site sets because the library
     * shows the state only as a class.
     */
    shell: '[data-test="link-open-shell"]',
    /**
     * The Shell item's trailing icon. Its `aria-label` says why the item is disabled; while it is
     * enabled, `tn-icon` falls back to the icon's name.
     */
    shellIcon: '[data-test="icon-open-shell"]',
  },

  /**
   * The details panel's Filesystem Devices card,
   * `container-filesystem-devices.component.html`. A device's menu ids are keyed
   * by its description, `<source> → <target>` as `getDeviceDescription` words it,
   * so they change when the device is edited. Its Edit and Delete raise the
   * filesystem device form and webui's shared confirm (see `locators/dialogs.ts`).
   */
  filesystemDevices: {
    /** "Add", the card's primary action, `testId: 'add-disk'` on a `TnCardAction`. */
    add: '[data-test="button-add-disk"]',
    /** "No filesystem devices added.", shown in place of the list while it is empty. */
    empty: '[data-test="text-no-filesystem-devices"]',
    /** A device's description line, `['filesystem-device', id]`. */
    device: (id: number): string => `[data-test="text-filesystem-device-${id}"]`,
    /** The `ix-device-actions-menu` trigger, `['actions-for', description]`. */
    actionsFor: (description: string): string => (
      `[data-test="button-actions-for-${kebabTestSegment(description)}"]`
    ),
    edit: (description: string): string => `[data-test="button-edit-${kebabTestSegment(description)}"]`,
    delete: (description: string): string => `[data-test="button-delete-${kebabTestSegment(description)}"]`,
  },

  /**
   * The filesystem device form, `container-filesystem-device-form.component.html`,
   * in a side panel with the panel's own Save.
   */
  filesystemDeviceForm: {
    /**
     * "Host Directory Source". A `tn-file-picker`, whose inner
     * `<input>` takes the control name. Typable, so the path goes in directly.
     */
    source: '[data-test="input-source"]',
    /** The source's validation message: the alert of the wrapping `tn-form-field`, which has no id of its own. */
    sourceErrors: '[data-test="form-field-source"] [role="alert"]',
    /** "Container Mount Path". */
    target: '[data-test="input-target"]',
  },

  /**
   * The details panel's NIC Devices card, `container-nic-devices.component.html`.
   * A device's menu ids are keyed by its description, `<nic_attach> (<mac>)` as
   * `getDeviceDescription` words it, or `<nic_attach> (Default Mac Address)` with
   * no MAC, so they change when an edit changes the MAC. Its Edit opens the NIC
   * dialog below; its Delete raises webui's shared confirm (see `locators/dialogs.ts`).
   */
  nicDevices: {
    /** "No network access", shown in place of the device list while the container has no NIC. */
    noNetwork: '[data-test="text-no-network"]',
    /** "Add NIC on <bridge>" under it, which adds a NIC with no `nic_attach`, so on the default bridge. */
    addDefaultNic: '[data-test="button-add-default-nic"]',
    /** A device's description line, `['nic-device', id]`. */
    device: (id: number): string => `[data-test="text-nic-device-${id}"]`,
    /**
     * "Add" in the card footer, `add-nic-menu.component.html`. Opens a menu of the
     * interfaces left to attach; replaced by plain text when none are.
     */
    add: '[data-test="button-add-nic"]',
    /** An interface in that menu, a `tn-menu-item` with `testId: ['add-nic', nic]`. */
    addNic: (nic: string): string => `[data-test="button-add-nic-${kebabTestSegment(nic)}"]`,
    /** The `ix-device-actions-menu` trigger, `['actions-for', description]`. */
    actionsFor: (description: string): string => (
      `[data-test="button-actions-for-${kebabTestSegment(description)}"]`
    ),
    edit: (description: string): string => `[data-test="button-edit-${kebabTestSegment(description)}"]`,
    delete: (description: string): string => `[data-test="button-delete-${kebabTestSegment(description)}"]`,
  },

  /**
   * The NIC dialog, `container-nic-form-dialog.component.html`,
   * `<tn-dialog-shell testId="container-nic-form">`. Add and Edit open the same
   * dialog, titled "Add NIC Device: <nic>" or "Edit NIC Device: <nic>".
   */
  nicForm: {
    title: '[data-test="dialog-title-container-nic-form"]',
    /** "NIC Type", `testId="type"`. Options are labelled `VirtIO` and `Intel e82585 (e1000)`. */
    type: '[data-test="select-type"]',
    typeOption: (label: string): string => `[data-test="option-type-${kebabTestSegment(label)}"]`,
    /** "Use Default Mac Address", ticked as Add opens and absent in Edit. */
    useDefault: '[data-test="checkbox-use-default"]',
    /** "Mac Address", shown once Use Default is unticked and always in Edit. */
    mac: '[data-test="input-mac"]',
    /** The field around {@link mac}, `testId="mac"`, which holds its error text. */
    macField: '[data-test="form-field-mac"]',
    /** "Trust Guest RX Filters", shown for VirtIO only. */
    trustGuestRxFilters: '[data-test="checkbox-trust-guest-rx-filters"]',
    cancel: '[data-test="button-cancel"]',
    /** The primary button, labelled Add or Update. `testId="close"`, not `save`. */
    submit: '[data-test="button-close"]',
  },

  /** `<tn-dialog-shell testId="delete-container">`. Delete enables once the confirmation is ticked. */
  deleteDialog: {
    confirm: '[data-test="checkbox-confirm"]',
    delete: '[data-test="button-delete"]',
  },

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
