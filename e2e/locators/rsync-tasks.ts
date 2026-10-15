/**
 * The Rsync Tasks card on Data Protection, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `convertStringToId('card-rsync-task-' + path + '-' + remotehost)`, which
 * lowercases the tag and turns its punctuation into hyphens before the
 * library's normalizer sees it. As on the snapshot task card, lowercasing first
 * and then running {@link kebabTestSegment} is the same id.
 *
 * The tag carries the path and the remote host and nothing else, so editing
 * either renames every id on the row, and two tasks on one path to one host
 * share every id. The specs give each task a dataset of its own and never edit
 * the host.
 *
 * The form's controls declare their `testId`s, its user is the same
 * `ix-user-combobox` the cron form uses, and its schedule is the shared
 * `ix-scheduler`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(path: string, remoteHost: string): string {
  return kebabTestSegment(`card-rsync-task-${path}-${remoteHost}`.toLowerCase());
}

export const rsyncTaskLocators = {
  card: {
    /** The card title, `tnTestIdType="link"` with `['rsync-task', 'open-in-new']`. Opens the full list. */
    open: '[data-test="link-rsync-task-open-in-new"]',
    /** `<tn-empty>`, rendered in place of the table once the card has loaded and found no task. */
    empty: '[data-test="text-rsync-task-empty"]',
    /** `<tn-button [testId]="addTestId">` in the card footer, `rsync-task-add`. */
    add: '[data-test="button-rsync-task-add"]',

    row: (path: string, remoteHost: string): string => `[data-test="row-${rowTag(path, remoteHost)}"]`,

    /** The Path cell. Its base is the column title, so `text-path`. */
    path: (path: string, remoteHost: string): string => (
      `[data-test="text-path-${rowTag(path, remoteHost)}-row-text"]`
    ),

    /**
     * The row's action menu trigger. The row has three actions (Edit, Run job,
     * Delete) and the card does not ask for `mode="inline"`, so they sit in a
     * kebab menu.
     */
    rowMenu: (path: string, remoteHost: string): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action"]`
    ),

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (path: string, remoteHost: string): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (path: string, remoteHost: string): string => (
      `[data-test="button-${rowTag(path, remoteHost)}-more-action-mdi-delete-row-action"]`
    ),

    /**
     * The row's Enabled switch. `ix-table-toggle-cell` composes `[title, row tag,
     * 'row-toggle']` and `tn-slide-toggle` puts its `toggle-` type in front. It
     * writes on click — there is no Save.
     */
    enabledToggle: (path: string, remoteHost: string): string => (
      `[data-test="toggle-enabled-${rowTag(path, remoteHost)}-row-toggle"]`
    ),
  },

  list: {
    /** The full list page's Add, in its page header. */
    add: '[data-test="button-add-task"]',
  },

  form: {
    /**
     * `ix-explorer` renders a `tn-file-picker`, whose inner `<input>` takes the
     * control name. Typable, so the path goes in directly rather than being
     * navigated as a tree.
     */
    path: '[data-test="input-path"]',
    /**
     * `ix-user-combobox`, a library `tn-autocomplete`: the input is
     * `autocomplete-<control>` and its rows `option-<control>-<username>`.
     */
    user: '[data-test="autocomplete-user"]',
    userOption: (username: string): string => `[data-test="option-user-${kebabTestSegment(username)}"]`,
    direction: '[data-test="select-direction"]',
    /** Labelled Push and Pull, so `option-direction-push`. */
    directionOption: (label: string): string => `[data-test="option-direction-${kebabTestSegment(label)}"]`,
    description: '[data-test="input-desc"]',
    /** Remote Host and Remote Module Name render only in Module mode, the form's default. */
    remoteHost: '[data-test="input-remotehost"]',
    remoteModule: '[data-test="input-remotemodule"]',
    /** `ix-scheduler` renders a `tn-select` with `[testId]="[controlName, 'presets']"`. */
    schedule: '[data-test="select-schedule-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-schedule-presets-${kebabTestSegment(label)}"]`
    ),
    /** Ticked by default. */
    recursive: '[data-test="checkbox-recursive"]',
    /** Unticked by default. */
    archive: '[data-test="checkbox-archive"]',
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
