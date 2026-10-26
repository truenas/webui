/**
 * The Cloud Sync Tasks card on Data Protection, its full list, its wizard, its
 * edit form and its restore dialog.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `convertStringToId('card-cloudsync-task-' + description)`, which lowercases
 * the tag and turns its punctuation into hyphens before the library's normalizer
 * sees it. As on the rsync task card, lowercasing first and then running
 * {@link kebabTestSegment} is the same id.
 *
 * The tag carries the description and nothing else, so editing the description
 * renames every id on the row. The specs never edit it.
 *
 * Add opens the wizard, not the form: a Provider step that picks a credential,
 * then What and When. Edit opens the full form. The two share their control
 * names, so most ids are the same in both.
 */
import { taskListDetailAction } from './data-protection';
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

function rowTag(description: string): string {
  return kebabTestSegment(`card-cloudsync-task-${description}`.toLowerCase());
}

/**
 * The full list's row tag, `toUniqueRowTag('cloudsync-task-' + description)`.
 *
 * Not the card's. It has no `card-` prefix, and `toUniqueRowTag` runs the whole
 * tag through lodash, which splits letters from digits, so `E2E …` comes out as
 * `e-2-e-…` here where the card writes `e2e-…`.
 */
function listRowTag(description: string): string {
  return legacyKebabTestSegment(`cloudsync-task-${description}`.toLowerCase());
}

export const cloudSyncLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['cloudsync-task', 'open-in-new']`. Opens the full list. */
    open: '[data-test="link-cloudsync-task-open-in-new"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-cloudsync-task-empty"]',
    /** `<tn-button [testId]="addTestId">` in the card footer, `cloudsync-task-add`. */
    add: '[data-test="button-cloudsync-task-add"]',

    row: (description: string): string => `[data-test="row-${rowTag(description)}"]`,

    /** The Description cell. Its base is the column title, so `text-description`. */
    description: (description: string): string => (
      `[data-test="text-description-${rowTag(description)}-row-text"]`
    ),

    /**
     * The State cell: `ix-task-state-cell` renders a `<button>` with the cell's
     * `testId`, and shows a finished job's state through `jobStateDisplay`,
     * which reads SUCCESS as "Completed".
     */
    state: (description: string): string => (
      `[data-test="button-state-${rowTag(description)}-row-state"]`
    ),

    /**
     * The row's action menu trigger. The row has six actions (Edit, Run job or
     * Stop, Dry Run, Restore, Delete) and the card does not ask for
     * `mode="inline"`, so they sit in a kebab menu.
     */
    rowMenu: (description: string): string => `[data-test="button-${rowTag(description)}-more-action"]`,

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Run job, inside that menu. Hidden while a run is in progress, when Stop takes its place. */
    rowMenuRun: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-play-circle-row-action"]`
    ),

    /** Stop, inside that menu. Offered only while the row's job is running, in Run job's place. */
    rowMenuStop: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-stop-circle-row-action"]`
    ),

    /** Dry Run, inside that menu. Always offered, running or not. */
    rowMenuDryRun: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-sync-row-action"]`
    ),

    /** Restore, inside that menu. Opens the restore dialog below. */
    rowMenuRestore: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-restore-row-action"]`
    ),

    /** Delete, inside that menu. */
    rowMenuDelete: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-delete-row-action"]`
    ),

    /**
     * The row's Enabled switch. `ix-table-toggle-cell` composes `[title, row tag,
     * 'row-toggle']` and `tn-slide-toggle` puts its `toggle-` type in front. It
     * writes on click — there is no Save.
     */
    enabledToggle: (description: string): string => (
      `[data-test="toggle-enabled-${rowTag(description)}-row-toggle"]`
    ),
  },

  list: {
    /** The full list page's Add, in its page header. */
    add: '[data-test="button-add-task"]',

    row: (description: string): string => `[data-test="row-${listRowTag(description)}"]`,

    /** Every row on the list, whichever task it is: a prefix of {@link row}. */
    anyRow: '[data-test^="row-cloudsync-task-"]',

    /**
     * The Description cell. Its base is the column title, so `text-description`.
     * Clicking it opens the row's detail panel, like clicking anywhere else in the row.
     */
    description: (description: string): string => (
      `[data-test="text-description-${listRowTag(description)}-row-text"]`
    ),

    /** The State cell, the same `ix-task-state-cell` as the card's, which reads SUCCESS as "Completed". */
    state: (description: string): string => (
      `[data-test="button-state-${listRowTag(description)}-row-state"]`
    ),

    /**
     * Run Now, in the row's detail panel, keyed by the task's id rather than its
     * description. Stop takes its place while the task's job is running.
     */
    runNow: (taskId: number): string => taskListDetailAction([taskId], 'run_now'),
    /** Edit, in the row's detail panel. Opens the same form as the card's Edit. */
    edit: (taskId: number): string => taskListDetailAction([taskId], 'edit'),
    /** Delete, in the row's detail panel. */
    delete: (taskId: number): string => taskListDetailAction([taskId], 'delete'),
  },

  wizard: {
    /**
     * `ix-cloud-credentials-select` renders a `tn-select` with `testId="cloud-credentials"`.
     * Each option is labelled `<name> (<provider>)`, so `option-cloud-credentials-<name>-sftp`.
     */
    credential: '[data-test="select-cloud-credentials"]',
    credentialOption: (name: string, provider: string): string => {
      const label = `${name} (${provider})`;
      return `[data-test="option-cloud-credentials-${kebabTestSegment(label)}"]`;
    },
    /** The Provider step's Next. Disabled until a credential is picked. */
    next: '[data-test="button-next"]',
    /**
     * The Provider step's Advanced Options. Enabled whether or not a credential is picked, and swaps
     * the wizard for the full form, {@link cloudSyncLocators.form}, in the same panel.
     */
    advanced: '[data-test="button-advanced"]',

    direction: '[data-test="select-direction"]',
    /** Labelled PUSH and PULL, so `option-direction-push`. */
    directionOption: (label: string): string => `[data-test="option-direction-${kebabTestSegment(label)}"]`,
    /**
     * The local directories a push sends. Rendered only in Push. `ix-explorer`
     * renders a `tn-file-picker` whose inner `<input>` takes the control name; in
     * multiple mode a typed value is split on commas and stored verbatim.
     */
    pathSource: '[data-test="input-path-source"]',
    /**
     * Where a push lands on the remote. Rendered only in Push, and only once the
     * credential has reached the step. Typed text is stored verbatim, so an
     * absolute path on the SFTP host goes in as it is.
     */
    folderDestination: '[data-test="input-folder-destination"]',
    /** Where a pull lands locally. Rendered only in Pull; a single explorer, so a typed path is stored verbatim. */
    pathDestination: '[data-test="input-path-destination"]',
    /**
     * What a pull fetches from the remote. Rendered only in Pull, and only once the
     * credential has reached the step. Multiple mode, like `pathSource`.
     */
    folderSource: '[data-test="input-folder-source"]',
    transferMode: '[data-test="select-transfer-mode"]',
    /** Labelled SYNC, COPY and MOVE, so `option-transfer-mode-sync`. */
    transferModeOption: (label: string): string => (
      `[data-test="option-transfer-mode-${kebabTestSegment(label)}"]`
    ),
    /** Filled in from the provider and the path as they change, so set it after both. */
    description: '[data-test="input-description"]',
    /** `ix-scheduler` renders a `tn-select` with `[testId]="[controlName, 'presets']"`. */
    schedule: '[data-test="select-cloudsync-picker-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-cloudsync-picker-presets-${kebabTestSegment(label)}"]`
    ),
    /** What and When's Save. The wizard is hosted `footerless`, so its steps own their buttons. */
    save: '[data-test="button-save"]',
  },

  form: {
    /** Patched in when the form opens on a task, which is what says it is editing that one. */
    description: '[data-test="input-description"]',
    transferMode: '[data-test="select-transfer-mode"]',
    /** Labelled SYNC, COPY and MOVE, so `option-transfer-mode-sync`. */
    transferModeOption: (label: string): string => (
      `[data-test="option-transfer-mode-${kebabTestSegment(label)}"]`
    ),
    schedule: '[data-test="select-cloudsync-picker-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-cloudsync-picker-presets-${kebabTestSegment(label)}"]`
    ),
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',
    /**
     * A push task's Folder on the remote, the same explorer as the wizard's
     * {@link cloudSyncLocators.wizard.folderDestination}. Rooted at `/` on the
     * remote, and browsed through `cloudsync.list_directory` over the task's credential.
     */
    folderDestination: '[data-test="input-folder-destination"]',
    /** The base of that explorer's popup ids — see `locators/explorer.ts`. */
    folderDestinationExplorer: 'folder-destination',
    /**
     * Transfers: three bandwidth presets and Custom. Picking Custom opens the
     * dialog below, and the number saved there comes back as a fourth option.
     */
    transfers: '[data-test="select-transfers"]',
    transfersOption: (label: string): string => `[data-test="option-transfers-${kebabTestSegment(label)}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',

    /**
     * The form's own footer action, beside Save: `footerActions` with `testId: 'dry-run'`, in create
     * and edit mode alike. Disabled while the form is invalid, loading or submitting.
     */
    dryRun: '[data-test="button-dry-run"]',
    /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
    closePanel: '[data-test="button-close-side-panel"]',

    /** The same control names as the wizard's, so the same ids. Starts as PULL in the form. */
    direction: '[data-test="select-direction"]',
    directionOption: (label: string): string => `[data-test="option-direction-${kebabTestSegment(label)}"]`,
    /** A push's local directories, rendered only in Push. Multiple mode, like the wizard's. */
    pathSource: '[data-test="input-path-source"]',
    /** `ix-cloud-credentials-select`, as in the wizard; options are labelled `<name> (<provider>)`. */
    credential: '[data-test="select-cloud-credentials"]',
    credentialOption: (name: string, provider: string): string => {
      const label = `${name} (${provider})`;
      return `[data-test="option-cloud-credentials-${kebabTestSegment(label)}"]`;
    },

    /**
     * Bucket, for a credential whose provider has buckets. Filled from `cloudsync.list_buckets`:
     * each option is labelled with the bucket's `Name` and holds its `Path`.
     */
    bucket: '[data-test="select-bucket"]',
    bucketOption: (name: string): string => `[data-test="option-bucket-${kebabTestSegment(name)}"]`,
    /**
     * The free-text Bucket the form falls back to when `cloudsync.list_buckets` fails. Rendered
     * instead of {@link bucket}, never beside it — so which of the two is there says whether the
     * call worked.
     */
    bucketInput: '[data-test="input-bucket-input"]',
  },

  customTransfers: {
    /** `<tn-dialog-shell testId="custom-transfers">`. What to wait on before acting on it. */
    title: '[data-test="dialog-title-custom-transfers"]',
    /** A number input. The form behind it holds `select-transfers`, so this one is unique. */
    transfers: '[data-test="input-transfers"]',
    /**
     * The dialog's own Save. It emits `button-save` like the edit form's, which
     * is still open behind it, so it is reached through the dialog's action row.
     */
    save: '[data-test="actions-custom-transfers"] [data-test="button-save"]',
  },

  restore: {
    /** `<tn-dialog-shell testId="cloudsync-restore">`. What to wait on before acting on it. */
    title: '[data-test="dialog-title-cloudsync-restore"]',
    description: '[data-test="input-description"]',
    /** Where the restored files go. A single `ix-explorer`, so a typed path is stored verbatim. */
    path: '[data-test="input-path"]',
    /** Disabled until the description and the path are both filled. */
    restore: '[data-test="button-restore"]',
  },
} as const;
