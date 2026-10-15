/**
 * The Periodic Snapshot Tasks card on Data Protection, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `convertStringToId('snapshot-task-' + dataset)`, which lowercases the tag and
 * turns its punctuation into hyphens before the library's normalizer sees it.
 * Everything but the lowercasing is something {@link kebabTestSegment} does
 * anyway, so lowercasing first and then running that is the same id — and it
 * matters only for a pool or dataset with capitals, where the normalizer alone
 * would split `MyPool` into `my-pool` and the card writes `mypool`.
 *
 * The tag carries the dataset and nothing else, so two tasks on one dataset
 * share every id; the specs give each task a dataset of its own.
 *
 * The form's controls declare their `testId`s, and its schedule is the shared
 * `ix-scheduler` — the same control the cron form uses.
 */
import { kebabTestSegment } from './test-id';

function rowTag(dataset: string): string {
  return kebabTestSegment(`snapshot-task-${dataset}`.toLowerCase());
}

export const snapshotTaskLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['snapshot-task', 'open-in-new']`. Opens the full list. */
    open: '[data-test="link-snapshot-task-open-in-new"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-snapshot-task-empty"]',
    /**
     * The pager's View All, `<ix-table-pager-show-more [testId]="['snapshot-task']">`.
     * Rendered only once there are more tasks than the card lists, and it leaves
     * for the full list rather than expanding the card.
     */
    viewAll: '[data-test="button-snapshot-task-show-more"]',
    /** `<tn-button testId="snapshot-task-add">` in the card footer. */
    add: '[data-test="button-snapshot-task-add"]',

    row: (dataset: string): string => `[data-test="row-${rowTag(dataset)}"]`,

    /** Every row on the card, whichever dataset it snapshots: a prefix of {@link row}. */
    anyRow: '[data-test^="row-snapshot-task-"]',

    /** The Pool/Dataset cell. Its base is the column title, so `text-pool-dataset`. */
    dataset: (dataset: string): string => `[data-test="text-pool-dataset-${rowTag(dataset)}-row-text"]`,

    /**
     * The row's action menu trigger. The row has two actions (Edit, Delete) and
     * the card does not ask for `mode="inline"`, so they sit in a kebab menu.
     */
    rowMenu: (dataset: string): string => `[data-test="button-${rowTag(dataset)}-more-action"]`,

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (dataset: string): string => (
      `[data-test="button-${rowTag(dataset)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (dataset: string): string => (
      `[data-test="button-${rowTag(dataset)}-more-action-mdi-delete-row-action"]`
    ),

    /**
     * The row's Enabled switch. `ix-table-toggle-cell` composes `[title, row tag,
     * 'row-toggle']` and `tn-slide-toggle` puts its `toggle-` type in front. It
     * writes on click — there is no Save.
     */
    enabledToggle: (dataset: string): string => `[data-test="toggle-enabled-${rowTag(dataset)}-row-toggle"]`,
  },

  list: {
    /** The full list page's Add, in its page header. */
    add: '[data-test="button-add-task"]',
  },

  form: {
    /** Options come from `pool.filesystem_choices`, labelled with the full dataset name. */
    dataset: '[data-test="select-dataset"]',
    datasetOption: (dataset: string): string => `[data-test="option-dataset-${kebabTestSegment(dataset)}"]`,
    /** Unticked by default. */
    recursive: '[data-test="checkbox-recursive"]',
    lifetimeValue: '[data-test="input-lifetime-value"]',
    lifetimeUnit: '[data-test="select-lifetime-unit"]',
    /** Labelled with the unit's wire value — `WEEK`, `DAY` — so the option is `option-lifetime-unit-day`. */
    lifetimeUnitOption: (unit: string): string => `[data-test="option-lifetime-unit-${kebabTestSegment(unit)}"]`,
    namingSchema: '[data-test="input-naming-schema"]',
    /** `ix-scheduler` renders a `tn-select` with `[testId]="[controlName, 'presets']"`. */
    schedule: '[data-test="select-schedule-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-schedule-presets-${kebabTestSegment(label)}"]`
    ),
    /** Begin, like End, renders only while the schedule is Hourly. */
    begin: '[data-test="select-begin"]',
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
