/**
 * The Containers page: its header, the Global Configuration form its
 * Configuration menu opens, and the Create New Container form.
 *
 * The header is `all-containers-header.component.html`, the settings form is
 * `global-config-form.component.html` and the create form is
 * `container-form.component.html`. Both forms open in a side panel, so Save and
 * the close button belong to the panel rather than to either form.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { kebabTestSegment } from './test-id';

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
  },

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
