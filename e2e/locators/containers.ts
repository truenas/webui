/**
 * The Containers page: its header, the Global Configuration form its
 * Configuration menu opens, the Create New Container form and its image
 * browser, the list, the details panel and the delete dialog.
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

export const containersLocators = {
  header: {
    /** "Configuration", a `tn-button` that opens a menu rather than a page. */
    configurationMenu: '[data-test="button-configuration-menu"]',
    /** "Settings" in that menu. A `tn-menu-item`, so its id is `button-<testId>`. */
    settings: '[data-test="button-global-configuration"]',
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
    /** "Browse Catalog", which opens the image browser. The Image field beside it is read-only. */
    browseImages: '[data-test="button-browse-images"]',
    image: '[data-test="input-image"]',
    /**
     * The side panel footer's Advanced/Basic toggle. The CPU Set and Environment
     * Variables sections render only in advanced mode.
     */
    advancedOptions: '[data-test="button-advanced-options"]',
    cpuset: '[data-test="input-cpuset"]',
    /** "Add" under Environment Variables: `tn-form-list` names it `['add-item', label]`. */
    addEnvironmentVariable: '[data-test="button-add-item-environment-variables"]',
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
   * `debian:bookworm:amd64:default`, so a prefix picks an image by its OS
   * without naming a release the registry will one day drop.
   */
  imageBrowser: {
    /** "Search Images", matched against the label. */
    search: '[data-test="input-search-query"]',
    selectImageOfOs: (os: string): string => `[data-test^="button-select-image-${kebabTestSegment(os)}-"]`,
  },

  list: {
    /** The `<tr>`, from `[rowTestId]`. Clicking it opens the container's details. */
    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,
    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,
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
    delete: '[data-test="button-delete-container"]',
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
     * "Host Directory Source". `ix-explorer` renders a `tn-file-picker`, whose inner
     * `<input>` takes the control name. Typable, so the path goes in directly.
     */
    source: '[data-test="input-source"]',
    /** The source's validation message, which `ix-explorer` renders as `text-<control>-errors`. */
    sourceErrors: '[data-test="text-source-errors"]',
    /** "Container Mount Path". */
    target: '[data-test="input-target"]',
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
