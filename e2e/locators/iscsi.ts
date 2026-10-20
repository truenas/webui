/**
 * iSCSI shares — the Block (iSCSI) Shares Targets card on the Shares dashboard,
 * the iSCSI Wizard it opens, the delete-target dialog, and the Targets and
 * Extents tabs of the full iSCSI page with their forms and dialogs.
 *
 * Derived from the templates rather than read off a running appliance; see
 * `signin.ts` for the type-prefixing that produces these values.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * What tells one row of the card from another: `card-iscsi-target-<name>`.
 *
 * Built with `toUniqueRowTag`, which runs the whole tag through lodash, so a
 * name with a letter/digit boundary is split there (`e2e` becomes `e-2-e`). The
 * row, its cells and its actions all start from this same tag.
 */
const rowTag = (name: string): string => legacyKebabTestSegment(`card-iscsi-target-${name}`);

/** The same, for a row of the Targets tab: `iscsi-target-<name>`, through lodash. */
const targetRowTag = (name: string): string => legacyKebabTestSegment(`iscsi-target-${name}`);

/** And for a row of the Extents tab: `iscsi-extent-<name>`, through lodash. */
const extentRowTag = (name: string): string => legacyKebabTestSegment(`iscsi-extent-${name}`);

export const iscsiLocators = {
  card: {
    /**
     * The card's title, a link to the full iSCSI page on its Targets tab —
     * `tnTestIdType="link"` with `['iscsi-share', 'open-in-new']`.
     */
    open: '[data-test="link-iscsi-share-open-in-new"]',

    /** "Wizard" in the card's footer — `testId="iscsi-share-wizard"` in `iscsi-card.component.html`. */
    wizard: '[data-test="button-iscsi-share-wizard"]',

    row: (name: string): string => `[data-test="row-${kebabTestSegment(rowTag(name))}"]`,

    /** The Target Name cell. */
    name: (name: string): string => `[data-test="text-target-name-${kebabTestSegment(rowTag(name))}-row-text"]`,

    /** The row's action menu trigger. The card does not ask for `mode="inline"`, so Edit and Delete are in a menu. */
    rowMenu: (name: string): string => `[data-test="button-${kebabTestSegment(rowTag(name))}-more-action"]`,

    /** Delete, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${kebabTestSegment(rowTag(name))}-more-action-mdi-delete-row-action"]`
    ),
  },

  wizard: {
    /**
     * Step 1, Target. Its select opens on "Create New", which is what a new share
     * wants, so the step needs only Next.
     */
    targetNext: '[data-test="button-target-next"]',

    /** Step 2, Extent. The name becomes the extent's, the target's and the new zvol's. */
    name: '[data-test="input-name"]',
    /** "Device". Opens empty; "Create New" makes a zvol for the extent. */
    disk: '[data-test="select-disk"]',
    diskCreateNew: '[data-test="option-disk-create-new"]',
    /**
     * Where the new zvol goes. `ix-explorer` renders a `tn-file-picker`, whose inner
     * `<input>` takes the control name, and it takes a `/mnt/…` path.
     */
    dataset: '[data-test="input-dataset"]',
    /** "Size", a size input that reads `64 MiB` the way the zvol form's does. */
    volsize: '[data-test="input-volsize"]',
    extentNext: '[data-test="button-extent-next"]',

    /** Step 3, Protocol Options. "Portal" opens empty; "Create New" asks for the addresses it listens on. */
    portal: '[data-test="select-portal"]',
    portalCreateNew: '[data-test="option-portal-create-new"]',
    /**
     * "Add" under the new portal's IP Address list. `tn-form-list` names its Add
     * control `['add-item', label]`, so this is the label, not the form array (`listen`).
     */
    addListen: '[data-test="button-add-item-ip-address"]',
    /**
     * A listen address, by its position in the list. The select is bound with
     * `[formControlName]="i"` and no `testId`, so its base is the index itself, and
     * its options are keyed by their label, an address.
     */
    listen: (index: number): string => `[data-test="select-${index}"]`,
    listenOption: (index: number, address: string): string => (
      `[data-test="option-${index}-${kebabTestSegment(address)}"]`
    ),

    save: '[data-test="button-save"]',
  },

  /**
   * "No" on the "Start iSCSI Service" dialog the wizard raises after a save while
   * the service is stopped — the same dialog, and so the same id, as SMB's and NFS's.
   */
  declineStartService: '[data-test="button-do-not-start"]',

  deleteDialog: {
    /**
     * "Delete N associated extent(s)". Rendered only once the dialog has loaded the
     * target's extents and found at least one, so its appearing is also that wait.
     */
    deleteExtents: '[data-test="checkbox-delete-extents"]',
    /** "Force Delete". Always rendered, and opens unticked. */
    force: '[data-test="checkbox-force"]',
    delete: '[data-test="button-delete"]',
  },

  /**
   * The Extents tab of the full iSCSI page. `tn-tab` emits `tab-<slug>`, and the
   * slug is `extents` in `iscsi.component.ts`.
   */
  extentsTab: '[data-test="tab-extents"]',

  /** The Targets tab: a list on the left, and the selected target's cards on the right. */
  targets: {
    /** "Add" in the list's header. */
    add: '[data-test="button-add-target"]',

    row: (name: string): string => `[data-test="row-${kebabTestSegment(targetRowTag(name))}"]`,

    /**
     * "Details for <name>" above the cards. The page opens with a target already
     * selected, so this is how to tell which one the cards are about.
     */
    detailsFor: '[data-test="text-details-for"]',

    /** The Alias cell of a target's row. */
    alias: (name: string): string => `[data-test="text-alias-${targetRowTag(name)}-row-text"]`,

    /** "Edit" in the detail header, for the selected target. Opens the target form in the side panel. */
    edit: '[data-test="button-edit-target"]',

    /** An authorized network on the selected target's card, by its position. */
    authorizedNetwork: (index: number): string => `[data-test="text-authorized-network-${index}"]`,

    /**
     * A group's Authentication Method on the selected target's iSCSI Groups card,
     * by the group's position. Shows middleware's value, `NONE`, `CHAP` or `CHAP_MUTUAL`.
     */
    authenticationMethod: (index: number): string => `[data-test="text-authentication-method-${index}"]`,
    /** The same group's Authentication Group Number: the auth tag, or `-`. */
    authenticationGroupNumber: (index: number): string => (
      `[data-test="text-authentication-group-number-${index}"]`
    ),

    /**
     * "Associate" on the selected target's Extents card. Keyed by the target's
     * name through lodash, so `e2e` reads `e-2-e`.
     */
    associate: (target: string): string => (
      `[data-test="button-${legacyKebabTestSegment(target)}-associate-target"]`
    ),

    /** An associated extent's line on that card — `LUN ID: <n> | <name> | <path>` — by the extent's id. */
    associatedExtent: (extentId: number): string => `[data-test="text-extent-${extentId}"]`,

    /** The unlink button beside that line. */
    removeAssociation: (extentId: number): string => (
      `[data-test="button-remove-extent-association-${extentId}"]`
    ),
  },

  /** The Add/Edit target form, in the side panel. */
  targetForm: {
    name: '[data-test="input-name"]',
    /** `<tn-form-field testId="name">` around {@link name}: its label and, once refused, the reason. */
    nameField: '[data-test="form-field-name"]',
    alias: '[data-test="input-alias"]',

    /** "Add" under Authorized Networks — `tn-form-list` names it `['add-item', label]`. */
    addNetwork: '[data-test="button-add-item-authorized-networks"]',
    /**
     * A network's address, by its position. `ix-ip-input-with-netmask` is given no
     * `testId` here, so it falls back to its control name, which in a form array
     * is the index. No other list on this form renders an input in iSCSI mode.
     */
    networkAddress: (index: number): string => `[data-test="input-${index}"]`,
    /**
     * The prefix length beside it. With no `testId`, every one on the form is
     * `select-netmasks`, so this only singles one out while there is one network.
     */
    networkPrefix: '[data-test="select-netmasks"]',
    networkPrefixOption: (bits: number): string => `[data-test="option-netmasks-${bits}"]`,

    /** "Add" under iSCSI Group. The list's label is "Add groups". */
    addGroup: '[data-test="button-add-item-add-groups"]',
    /** The group's Portal Group ID, whose options read `<id> (<comment>)`. */
    portal: '[data-test="select-portal"]',
    portalOption: (id: number, comment: string): string => {
      const label = `${id} (${comment})`;
      return `[data-test="option-portal-${kebabTestSegment(label)}"]`;
    },
    /** The group's Initiator Group ID. A group allowing everyone reads `<id> (ALL Initiators Allowed)`. */
    initiator: '[data-test="select-initiator"]',
    allowAllInitiatorOption: (id: number): string => {
      const label = `${id} (ALL Initiators Allowed)`;
      return `[data-test="option-initiator-${kebabTestSegment(label)}"]`;
    },
    /** The group's Authentication Method. Options are labelled `None`, `CHAP` and `Mutual CHAP`. */
    authmethod: '[data-test="select-authmethod"]',
    authmethodChapOption: '[data-test="option-authmethod-chap"]',
    /** The group's Authentication Group Number. Options are the authorized access tags. */
    auth: '[data-test="select-auth"]',
    authOption: (tag: number): string => `[data-test="option-auth-${tag}"]`,

    save: '[data-test="button-save"]',
  },

  /** The dialog "Associate" opens: a LUN ID and an extent not yet associated with the target. */
  associateDialog: {
    lunId: '[data-test="input-lunid"]',
    extent: '[data-test="select-extent"]',
    /** Options are the extents' names. */
    extentOption: (name: string): string => `[data-test="option-extent-${kebabTestSegment(name)}"]`,
    associate: '[data-test="button-associate-target"]',
  },

  /** The Extents tab. */
  extents: {
    /**
     * "Add" in the list's header. The same id as the Targets tab's Add — a frozen
     * misnomer in `extent-list.component.html`. The page mounts one tab at a
     * time, so this is only unambiguous once the Extents tab's URL is showing.
     */
    add: '[data-test="button-add-target"]',

    row: (name: string): string => `[data-test="row-${kebabTestSegment(extentRowTag(name))}"]`,

    /** The Description cell, which shows the extent's `comment`. */
    description: (name: string): string => `[data-test="text-description-${extentRowTag(name)}-row-text"]`,

    /** The row's action menu trigger: Edit and Delete collapse behind it. */
    rowMenu: (name: string): string => `[data-test="button-${kebabTestSegment(extentRowTag(name))}-more-action"]`,
    rowMenuEdit: (name: string): string => (
      `[data-test="button-${kebabTestSegment(extentRowTag(name))}-more-action-mdi-pencil-row-action"]`
    ),
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${kebabTestSegment(extentRowTag(name))}-more-action-mdi-delete-row-action"]`
    ),
  },

  /** The Add/Edit extent form, in the side panel. */
  extentForm: {
    name: '[data-test="input-name"]',
    /** "Description". The control is `comment`, which is what middleware stores it as. */
    comment: '[data-test="input-comment"]',

    /** "Extent Type". Opens on Device. */
    type: '[data-test="select-type"]',
    typeFile: '[data-test="option-type-file"]',

    /** "Device", for a Device extent. */
    disk: '[data-test="select-disk"]',
    /**
     * A zvol among its options. Middleware labels each `<pool>/<zvol> (<size>)`,
     * and the size is formatted on the appliance, so this matches the head of the
     * id. The trailing `-` keeps a zvol whose name extends this one from matching.
     */
    diskZvolOption: (zvol: string): string => `[data-test^="option-disk-${kebabTestSegment(zvol)}-"]`,

    /**
     * "Path to the Extent", for a File extent. `ix-explorer` renders a
     * `tn-file-picker` whose inner `<input>` takes the control name.
     */
    path: '[data-test="input-path"]',
    /** "Filesize", a size input that reads `16 MiB`. */
    filesize: '[data-test="input-filesize"]',

    /** "Logical Block Size". Options are the sizes in bytes. */
    blocksize: '[data-test="select-blocksize"]',
    blocksizeOption: (bytes: number): string => `[data-test="option-blocksize-${bytes}"]`,

    save: '[data-test="button-save"]',
  },

  /** The dialog Delete opens from an extent's row. */
  deleteExtentDialog: {
    /** "Remove file?" — rendered only for a File extent. */
    removeFile: '[data-test="checkbox-remove"]',
    delete: '[data-test="button-delete"]',
  },
} as const;
