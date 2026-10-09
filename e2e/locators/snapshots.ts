/**
 * Snapshots — the dataset's Data Protection card, the take-snapshot form, the
 * snapshot list and the dialogs its rows open.
 *
 * Every value below was read off a running appliance.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * A list row's tag: `snapshot-<dataset>@<name>`, the snapshot's full name.
 *
 * Through lodash, whole — `toUniqueRowTag` pre-normalizes the tag before the
 * library sees it — so `e2e_tank/data@first` is `e-2-e-tank-data-first`. See
 * `locators/test-id.ts`.
 */
const rowTag = (dataset: string, name: string): string => legacyKebabTestSegment(`snapshot-${dataset}@${name}`);

export const snapshotLocators = {
  /**
   * The Data Protection card in a dataset's details, where both journeys start.
   */
  card: {
    /** "Take Snapshot" — opens the form with this dataset already chosen. */
    takeSnapshot: '[data-test="button-create-snapshot"]',
    /** "View Snapshots" — the list, filtered to this dataset. */
    viewSnapshots: '[data-test="link-manage-snapshots"]',
  },

  form: {
    /**
     * The dataset picker. Its text is the chosen dataset, which is how a test
     * sees that the card handed its own dataset over.
     */
    dataset: '[data-test="select-dataset"]',
    /** Opens holding a generated `manual-<date>_<time>` name. */
    name: '[data-test="input-name"]',
    recursive: '[data-test="checkbox-recursive"]',
    save: '[data-test="button-save"]',
  },

  list: {
    /** "Add" in the page header. Present once the list has rendered, whatever is in it. */
    add: '[data-test="button-add-snapshot"]',

    /** A snapshot's row. */
    row: (dataset: string, name: string): string => `[data-test="row-${rowTag(dataset, name)}"]`,

    /**
     * A row's Snapshot cell. What to click to expand the row: a click anywhere
     * on it does the same, but the row's first cell is its selection tick box.
     */
    nameCell: (dataset: string, name: string): string => (
      `[data-test="text-snapshot-${rowTag(dataset, name)}-row-text"]`
    ),
  },

  /**
   * The expanded row. Keyed by the snapshot's own name alone — not its dataset
   * — and through the library normalizer, unlike the row above it. Only one row
   * is expanded at a time, so within the list the short name is enough.
   */
  details: {
    /**
     * "Hold". Writes on click (`pool.snapshot.hold` / `release`); there is no
     * Save. Not keyed at all, so it is whichever row is expanded.
     */
    hold: '[data-test="checkbox-hold"]',
    /**
     * "Date created". Rendered only once the row's own query has answered, so
     * it is the sign that the details have loaded — the buttons and the Hold
     * box are there before that, over nothing.
     */
    created: (name: string): string => `[data-test="date-created-${kebabTestSegment(name)}"]`,
    clone: (name: string): string => `[data-test="button-clone-${kebabTestSegment(name)}"]`,
    rollback: (name: string): string => `[data-test="button-rollback-${kebabTestSegment(name)}"]`,
    delete: (name: string): string => `[data-test="button-delete-${kebabTestSegment(name)}"]`,
  },

  rollbackDialog: {
    title: '[data-test="dialog-title-snapshot-rollback"]',

    /**
     * "No Safety Check (CAUTION)" — the third of the three "stop if snapshots
     * exist" choices, and the only one that will roll back past a newer
     * snapshot, by destroying it. The dialog opens on the first and strictest.
     */
    noSafetyCheck: '[data-test="radio-button-recursive-no-safety-check-caution"]',

    /** "Confirm". Required: Rollback stays disabled until it is ticked. */
    confirm: '[data-test="checkbox-force"]',
    submit: '[data-test="button-rollback"]',
    cancel: '[data-test="button-cancel"]',

    /**
     * "Go to Storage" — rendered only once the rollback has happened, in place
     * of Rollback. The success sentence above it has no id; this is the
     * addressable sign of the same state.
     */
    goToStorage: '[data-test="button-go-to-storage"]',
    close: '[data-test="button-close"]',
  },

  cloneDialog: {
    title: '[data-test="dialog-title-snapshot-clone"]',
    /** The new dataset's full name. Opens holding a suggestion. */
    datasetName: '[data-test="input-dataset-dst"]',
    submit: '[data-test="button-clone"]',
    /** "Go to Datasets" — rendered only once the clone exists. Same role as `goToStorage` above. */
    goToDatasets: '[data-test="button-go-to-datasets"]',
    close: '[data-test="button-close"]',
  },

  /** The app's error dialog, which is where a refused rollback is reported. */
  errorDialog: {
    title: '[data-test="dialog-title-error"]',
    close: '[data-test="button-close-error-dialog"]',
  },
} as const;
