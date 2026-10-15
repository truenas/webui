/**
 * NFS shares — the dashboard card and the share form.
 *
 * Every value below was read off a running appliance. An NFS share has no name,
 * so where an SMB locator takes one these take the path — and the description,
 * which the card folds into the row's identity; see {@link rowTag}.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * What tells one row of the card from another: `<path>-<description>`.
 *
 * The description is part of it because middleware allows one path to be
 * exported more than once, so the path alone would not be unique. The cost is
 * that **editing a share's description changes every id on its row**, and a
 * test that edits one has to look for the row under its new tag afterwards.
 *
 * An empty description leaves a trailing separator, which the normalizers trim.
 */
const rowTag = (path: string, description: string): string => `${path}-${description}`;

/** The list page's row tag: {@link rowTag} behind `nfs-share-`, through lodash as a whole. */
const listRowTag = (path: string, description: string): string => (
  legacyKebabTestSegment(`nfs-share-${rowTag(path, description)}`)
);

/** Middleware's names for a share's security flavours, which are also the Security select's labels. */
export type NfsSecurityFlavour = 'SYS' | 'KRB5' | 'KRB5I' | 'KRB5P';

/** Middleware's names for the NFS protocol versions. */
export type NfsProtocolName = 'NFSV3' | 'NFSV4';

/** What the Enabled Protocols select shows for each version. Its option ids are keyed on these labels. */
export const nfsProtocolLabels: Record<NfsProtocolName, string> = {
  NFSV3: 'NFSv3',
  NFSV4: 'NFSv4',
};

export const nfsLocators = {
  /**
   * "Add" in the UNIX (NFS) Shares card on the Shares dashboard —
   * `testId="nfs-share-add"` in `nfs-card.component.html`. The card's button,
   * not the standalone list page's: the sidebar lands on the dashboard.
   */
  addShare: '[data-test="button-nfs-share-add"]',

  form: {
    /**
     * `ix-explorer` renders a `tn-file-picker`, whose inner `<input>` takes the
     * control name. Typable, so the path goes in directly rather than being
     * navigated as a tree.
     */
    path: '[data-test="input-path"]',
    /** "Description". The control is `comment`, which is also what middleware stores it as. */
    comment: '[data-test="input-comment"]',

    /**
     * Reveals the Access section. The footer toggle `advancedModeFooterAction`
     * provides, so the same id as on every other form that has one.
     */
    advancedToggle: '[data-test="button-toggle-advanced-options"]',
    /** "Read Only" — in the Access section, so not rendered until {@link advancedToggle} is on. */
    readOnly: '[data-test="checkbox-ro"]',

    /**
     * The four mapping fields, also in the Access section. Each is an
     * `ix-user-combobox` or `ix-group-combobox` with an explicit `testId`, which
     * renders a library `tn-autocomplete`: the input is `autocomplete-<testId>`
     * and its rows are `option-<testId>-<name>`.
     */
    maprootUser: '[data-test="autocomplete-maproot-user"]',
    maprootUserOption: (user: string): string => `[data-test="option-maproot-user-${kebabTestSegment(user)}"]`,
    maprootGroup: '[data-test="autocomplete-maproot-group"]',
    maprootGroupOption: (group: string): string => `[data-test="option-maproot-group-${kebabTestSegment(group)}"]`,
    mapallUser: '[data-test="autocomplete-mapall-user"]',
    mapallUserOption: (user: string): string => `[data-test="option-mapall-user-${kebabTestSegment(user)}"]`,
    mapallGroup: '[data-test="autocomplete-mapall-group"]',
    mapallGroupOption: (group: string): string => `[data-test="option-mapall-group-${kebabTestSegment(group)}"]`,

    /**
     * "Security", a multiple `tn-select`. Rendered only while the NFS service has
     * NFSv4 among its protocols, which the form reads from `nfs.config` as it opens.
     * Options are keyed on their labels, which are the flavours' own names
     * (`SYS`, `KRB5`, …), so they read like the values middleware stores.
     */
    security: '[data-test="select-security"]',
    securityOption: (flavour: NfsSecurityFlavour): string => (
      `[data-test="option-security-${kebabTestSegment(flavour)}"]`
    ),

    /**
     * The path's validation message, when it has one. Rendered by `ix-explorer`
     * under the picker, and named for the control: `text-<control>-errors`.
     */
    pathErrors: '[data-test="text-path-errors"]',

    /** "Add" under Networks, which appends an empty address/prefix pair. */
    addNetwork: '[data-test="button-add-item-networks"]',
    /**
     * A network's address, by its position in the list.
     *
     * Named for the list as well as the index because both lists are form
     * arrays, whose controls are named `0`, `1`, … — left to the control name,
     * the first network and the first host would both be `input-0`.
     */
    networkAddress: (index: number): string => `[data-test="input-network-${index}"]`,
    /** The prefix length beside that address. The two together are one stored value. */
    networkPrefix: (index: number): string => `[data-test="select-network-${index}-netmask"]`,
    networkPrefixOption: (index: number, bits: number): string => (
      `[data-test="option-network-${index}-netmask-${bits}"]`
    ),
    /** The field around a network: its label and, once refused, the reason. */
    networkField: (index: number): string => `[data-test="form-field-network-${index}"]`,

    /** "Add" under Hosts, which appends an empty host field. */
    addHost: '[data-test="button-add-item-hosts"]',
    /** A host, by its position in the list. */
    host: (index: number): string => `[data-test="input-host-${index}"]`,

    save: '[data-test="button-save"]',
  },

  /**
   * "Start" on the "Start NFS Service" dialog — the same component, and so the
   * same ids, as SMB's. Raised after a save only while the service is stopped.
   *
   * The dialog's "start automatically" toggle is on by default, so accepting
   * also enables the service at boot.
   */
  startService: '[data-test="button-enable-service"]',
  /** "No" on that same dialog. What a spec that only cares about the form clicks. */
  declineStartService: '[data-test="button-do-not-start"]',

  /**
   * The NFS service settings, reached from the card header's menu and opened in
   * the card's own side panel. The form is `service-nfs.component.html`.
   */
  serviceConfig: {
    /**
     * The card header's menu trigger, `button-<service.id>-actions-menu` from
     * `ServiceActionsMenuService.cardHeaderMenuTriggerTestId` — keyed on the
     * service's numeric id, which the test reads over the API.
     */
    cardMenuTrigger: (serviceId: number): string => `[data-test="button-${serviceId}-actions-menu"]`,
    /** "Config Service" in that menu: `['button', 'nfs', 'actions-menu', 'Config Service']`, joined. */
    open: '[data-test="button-nfs-actions-menu-config-service"]',
    /** "Enabled Protocols", a multiple `tn-select` with `testId="protocols"`. */
    protocols: '[data-test="select-protocols"]',
    protocolOption: (protocol: NfsProtocolName): string => (
      `[data-test="option-protocols-${kebabTestSegment(nfsProtocolLabels[protocol])}"]`
    ),
    save: '[data-test="button-save"]',
  },

  card: {
    /**
     * The NFS service switch in the card header. Starts or stops the service
     * outright; there is no confirmation. It moves on click, before the service
     * has; {@link serviceStatus} is the state the card actually holds.
     */
    serviceToggle: '[data-test="toggle-service-nfs"]',
    /** The header's status readout, whose text is the service state as the card believes it. */
    serviceStatus: '[data-test="button-service-status-nfs"]',

    /**
     * A share's row in the dashboard card.
     *
     * The row tag goes through the library's normalizer (`…-e2e-nfs-ds`); the
     * text cells inside the same row go through lodash (`…-e-2-e-nfs-ds`). See
     * the note in `locators/test-id.ts`.
     *
     * The card shows four shares, by path, so a spec keeps its shares few.
     */
    row: (path: string, description = ''): string => (
      `[data-test="row-card-nfs-share-${kebabTestSegment(rowTag(path, description))}"]`
    ),

    /**
     * A share's Description cell. A text cell, so the lodash spelling beside a
     * row tag that spells the same path differently — see {@link row}.
     */
    description: (path: string, description = ''): string => (
      `[data-test="text-description-card-nfs-share-${legacyKebabTestSegment(rowTag(path, description))}-row-text"]`
    ),

    /**
     * The row's action menu trigger. A kebab menu rather than inline buttons:
     * the row has Edit and Delete, and a tier action besides where tiering is on.
     */
    rowMenu: (path: string, description = ''): string => (
      `[data-test="button-card-nfs-share-${kebabTestSegment(rowTag(path, description))}-more-action"]`
    ),

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (path: string, description = ''): string => (
      `[data-test="button-card-nfs-share-${kebabTestSegment(rowTag(path, description))}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (path: string, description = ''): string => (
      `[data-test="button-card-nfs-share-${kebabTestSegment(rowTag(path, description))}-more-action-mdi-delete-row-action"]`
    ),

    /** The per-row Enabled switch. Through the library normalizer, like the row and its actions. */
    enabledToggle: (path: string, description = ''): string => (
      `[data-test="toggle-enabled-card-nfs-share-${kebabTestSegment(rowTag(path, description))}-row-toggle"]`
    ),

    /**
     * The card's title, "UNIX (NFS) Shares". A link to the standalone list page:
     * `tnTestIdType="link"` with `['nfs-share', 'open-in-new']`.
     */
    title: '[data-test="link-nfs-share-open-in-new"]',
  },

  /** The standalone NFS list page at `/sharing/nfs` (`nfs-list.component.html`). */
  list: {
    /** The list page's own Add, `[testId]="'add-nfs-share'"`. Opens the same form as the card's. */
    add: '[data-test="button-add-nfs-share"]',
    /** `ix-basic-search`, a `tn-input` with `testId="search"`. Filters as you type, on every field. */
    search: '[data-test="input-search"]',
    /** "NFS Sessions", a plain anchor kept for its legacy `link-nfs-sessions` id. */
    sessionsLink: '[data-test="link-nfs-sessions"]',

    /**
     * A share's row. The tag is `toUniqueRowTag('nfs-share-' + path + '-' + comment)`,
     * which goes through lodash as a whole, so `/mnt/tank/e2e_x` is `mnt-tank-e-2-e-x`
     * here where the card's row has `mnt-tank-e2e-x`.
     */
    row: (path: string, description = ''): string => `[data-test="row-${listRowTag(path, description)}"]`,
    /** Every share row on the page, to count what a search left. */
    anyRow: '[data-test^="row-nfs-share-"]',
  },

  /** The NFS Sessions page at `/sharing/nfs/sessions` (`nfs-session-list.component.html`). */
  sessions: {
    /** The NFS 3 / NFS 4 switch: `<tn-button-toggle [testId]="['nfs', 'nfs-3']">`, and `nfs-4`. */
    nfs3: '[data-test="button-toggle-nfs-nfs-3"]',
    nfs4: '[data-test="button-toggle-nfs-nfs-4"]',
    /** "Refresh", which queries the version that is showing again. */
    refresh: '[data-test="button-refresh-data"]',
    /**
     * Each version's empty state, rendered in place of its table once a query
     * has answered with no client. One per version, so which one is showing says
     * which version answered.
     */
    nfs3Empty: '[data-test="text-nfs3-sessions-empty"]',
    nfs4Empty: '[data-test="text-nfs4-sessions-empty"]',
  },
} as const;
