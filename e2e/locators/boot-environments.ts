/**
 * The Boot Environments list on System > Boot with its header, clone form, delete and Stats/Settings dialogs,
 * plus the Boot Pool Status page and its Attach dialog. Row ids come from `uniqueRowTag`, `bootenv-<name>`, with
 * no pre-normalizing, so everything goes through the library normalizer. `mode="inline"` makes actions row
 * buttons: row tag, icon with its library, then `row-action`; Keep (`bookmark-outline`) and Unkeep alternate.
 * The clone form is `ix-form-renderer` from `bootenv.form-config.ts`, so ids are control names.
 */
import { kebabTestSegment } from './test-id';

/**
 * `bootenv-<name>`, as `uniqueRowTag` writes it. Exported for the controls
 * `tn-table` draws on the row (`locators/table.ts`).
 */
export function bootEnvironmentRowTag(name: string): string {
  return kebabTestSegment(`bootenv-${name}`);
}

const rowTag = bootEnvironmentRowTag;

export const bootEnvironmentLocators = {
  /**
   * The Batch Operations toolbar, drawn only while at least one row is ticked.
   *
   * Its Delete is disabled unless the selection holds a boot environment that is
   * neither running nor set to boot next. It emits the same `button-delete` as the
   * delete dialog's own Delete, and stays in the page behind the dialog, so this
   * bare id is only for before the dialog opens.
   */
  batch: {
    delete: '[data-test="button-delete"]',
  },

  /** The page header. Stats/Settings and Scrub Boot Pool need `BOOTENV_WRITE`; Boot Pool Status does not. */
  header: {
    stats: '[data-test="button-bootenv-stats"]',
    scrub: '[data-test="button-bootenv-scrub"]',
    /** A link to `/system/boot/status`. */
    status: '[data-test="button-bootenv-status"]',
  },

  list: {
    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    /** The Keep cell, a translated Yes/No — hence the `row-yesno` suffix. */
    keep: (name: string): string => `[data-test="text-keep-${rowTag(name)}-row-yesno"]`,

    /**
     * The Date Created cell, in the account's date and time format. Its id starts
     * from the *translated* column title, so it only matches while the app is in
     * English.
     */
    dateCreated: (name: string): string => `[data-test="text-date-created-${rowTag(name)}-row-date"]`,

    clone: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-content-copy-row-action"]`,

    /** Hidden once the flag is set, when Unkeep (`mdi-bookmark`) takes its place. */
    keepAction: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-bookmark-outline-row-action"]`,

    /** Shown only once the flag is set, in Keep's place. */
    unkeepAction: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-bookmark-row-action"]`,

    /** Hidden on the running boot environment and the one set to boot next. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,

    /**
     * The Active cell: `Now` for the running boot environment, `Restart` for the one
     * set to boot next, `No` otherwise. Like Date Created, its id starts from the
     * translated column title.
     */
    active: (name: string): string => `[data-test="text-active-${rowTag(name)}-row-text"]`,

    /** Hidden on the boot environment already set to boot next, and on one middleware says cannot be. */
    activate: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-check-decagram-row-action"]`,
  },

  /** `BootenvStatsDialog`, raised by Stats/Settings. `<tn-dialog-shell testId="bootenv-stats">`. */
  statsDialog: {
    title: '[data-test="dialog-title-bootenv-stats"]',
    /** "Scrub interval (in days)". Required, and at least 1. */
    interval: '[data-test="input-interval"]',
    /** Disabled while the interval is invalid. Closes the dialog once the interval is saved. */
    updateInterval: '[data-test="button-update-interval"]',
  },

  /** `BootPoolAttachDialog`, raised by Attach on a boot disk. `<tn-dialog-shell testId="boot-pool-attach">`. */
  attachDialog: {
    title: '[data-test="dialog-title-boot-pool-attach"]',
    /**
     * "Member Disk", an `ix-unused-disk-select` with `testId="dev"`: the input is
     * `autocomplete-dev` and its rows `option-dev-<label>`, a label being the device
     * name and its size. Matched on the device name, as in `locators/pool-devices.ts`.
     */
    disk: '[data-test="autocomplete-dev"]',
    diskOption: (devname: string): string => `[data-test^="option-dev-${kebabTestSegment(devname)}-"]`,
    /** "Use all disk space". Unticked when the dialog opens. */
    expand: '[data-test="checkbox-expand"]',
    /**
     * The bare id: the dialog's `ix-form-actions` carries no `tnTestId`, so there is no
     * action row to scope it by, and Boot Pool Status behind it renders no other Save.
     */
    save: '[data-test="button-save"]',
  },

  cloneForm: {
    target: '[data-test="input-target"]',
    /** Prefilled with the row the form was opened from, and disabled. */
    source: '[data-test="input-source"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /** Boot Pool Status, the boot pool's device tree. */
  status: {
    /**
     * A device's Name cell, `[ownName(), 'name']` in `bootenv-node-item`: the
     * topology entry's `name`, a partition such as `sda3` or a vdev such as `mirror-0`.
     */
    deviceName: (name: string): string => `[data-test="text-${kebabTestSegment(name)}-name"]`,

    /**
     * A vdev's expand toggle, `[toggleTestId]="['toggle-row', guid]"` on its
     * `tn-nested-tree-node`. Only the boot pool's own node is expanded when the
     * page loads, so a mirror's disks are drawn only once this is clicked.
     */
    toggle: (guid: string): string => `[data-test="button-toggle-row-${kebabTestSegment(guid)}"]`,

    /** A device's actions menu, rendered only on a disk or a mirror whose topology entry carries a `path`. */
    actions: (name: string): string => `[data-test="button-${kebabTestSegment(name)}-actions"]`,
    /** In a disk's menu, only while the boot pool is a single disk. */
    attach: '[data-test="button-attach"]',
    /** In a mirror's menu. */
    detach: '[data-test="button-detach"]',

    /** The scan panel: `FINISHED` once a scrub is over, and when the last one started. */
    scanStatus: '[data-test="text-scan-status"]',
    scanDate: '[data-test="text-scan-date"]',
  },

  /**
   * `BootPoolDeleteDialog`, not webui's shared confirm. `<tn-dialog-shell testId="boot-pool-delete">`.
   *
   * Its Cancel declares `testId="save"`, so `button-save` inside it is Cancel; nothing here uses it.
   */
  deleteDialog: {
    title: '[data-test="dialog-title-boot-pool-delete"]',
    /** "The following N boot environment(s) will be deleted…", until Delete has run. */
    message: '[data-test="text-delete-message"]',
    /** One line per boot environment the dialog will delete. */
    item: (name: string): string => `[data-test="text-boot-environment-${kebabTestSegment(name)}"]`,
    confirm: '[data-test="checkbox-confirm"]',
    /**
     * The dialog's own Delete, scoped by its action row: the list's batch toolbar
     * emits the same `button-delete` and stays in the page behind the dialog.
     */
    delete: '[data-test="actions-boot-pool-delete"] [data-test="button-delete"]',
    /**
     * The report once a job of more than one item has run, or of one that failed;
     * a single successful item closes the dialog instead. Each is drawn only when
     * its count is above zero.
     */
    failed: '[data-test="text-delete-failed"]',
    succeeded: '[data-test="text-delete-succeeded"]',
    /** Replaces Cancel and Delete once the job has run. Closes the dialog and reloads the list. */
    close: '[data-test="actions-boot-pool-delete"] [data-test="button-close"]',
  },
} as const;
