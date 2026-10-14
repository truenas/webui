/**
 * The Cloud Sync Tasks card on Data Protection, its wizard, its edit form and
 * its restore dialog.
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
import { kebabTestSegment } from './test-id';

function rowTag(description: string): string {
  return kebabTestSegment(`card-cloudsync-task-${description}`.toLowerCase());
}

export const cloudSyncLocators = {
  card: {
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

    /** Restore, inside that menu. Opens the restore dialog below. */
    rowMenuRestore: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-restore-row-action"]`
    ),

    /** Delete, inside that menu. */
    rowMenuDelete: (description: string): string => (
      `[data-test="button-${rowTag(description)}-more-action-mdi-delete-row-action"]`
    ),
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
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
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
