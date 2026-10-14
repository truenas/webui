/**
 * iSCSI shares — the Block (iSCSI) Shares Targets card on the Shares dashboard,
 * the iSCSI Wizard it opens, and the delete-target dialog.
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

export const iscsiLocators = {
  card: {
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
    delete: '[data-test="button-delete"]',
  },
} as const;
