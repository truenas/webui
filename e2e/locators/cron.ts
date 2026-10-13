/**
 * The Cron Jobs card on System > Advanced Settings, its form and its delete dialog.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `card-cron-<command>-<user>`, a plain concatenation with no pre-normalizing —
 * so the row, its cells and its action menu all go through the library's
 * normalizer, and {@link kebabTestSegment} is the one to use throughout. The tag
 * carries the command, so **editing the command renames every id on the row**;
 * a spec that edits it looks the row up again under the new value. The
 * description is not in the tag at all, so two jobs running one command as one
 * user share every id, and the specs keep their commands distinct.
 *
 * The form is a hand-written template whose controls fall back to their
 * `formControlName`, so the field ids read like the API's own keys — `stdout`
 * and `stderr` included, though the screen labels them "Hide Standard Output"
 * and "Hide Standard Error".
 */
import { kebabTestSegment } from './test-id';

/**
 * A schedule preset's option is keyed by its whole label, which is the preset's
 * name and its description run together. Hourly is the one whose description
 * carries no time of day — the others format midnight for the browser's locale,
 * so their ids are not knowable in advance.
 */
export const hourlyScheduleLabel = 'Hourly At the start of each hour';

function rowTag(command: string, user: string): string {
  return kebabTestSegment(`card-cron-${command}-${user}`);
}

export const cronLocators = {
  card: {
    /** `<tn-button [testId]="['cron', 'add']">` in the card footer. */
    add: '[data-test="button-cron-add"]',

    row: (command: string, user: string): string => `[data-test="row-${rowTag(command, user)}"]`,

    /** The Description cell. Titled "Description", so its base is `text-description`. */
    description: (command: string, user: string): string => (
      `[data-test="text-description-${rowTag(command, user)}-row-text"]`
    ),

    /** The Enabled cell, a translated Yes/No — hence the `row-yesno` suffix. */
    enabled: (command: string, user: string): string => (
      `[data-test="text-enabled-${rowTag(command, user)}-row-yesno"]`
    ),

    /**
     * The row's action menu trigger. A kebab menu rather than inline buttons:
     * the row has three actions and the card does not ask for `mode="inline"`.
     */
    rowMenu: (command: string, user: string): string => (
      `[data-test="button-${rowTag(command, user)}-more-action"]`
    ),

    /** Run, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuRun: (command: string, user: string): string => (
      `[data-test="button-${rowTag(command, user)}-more-action-mdi-play-circle-row-action"]`
    ),

    /** Edit, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuEdit: (command: string, user: string): string => (
      `[data-test="button-${rowTag(command, user)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuRun}. */
    rowMenuDelete: (command: string, user: string): string => (
      `[data-test="button-${rowTag(command, user)}-more-action-mdi-delete-row-action"]`
    ),
  },

  form: {
    description: '[data-test="input-description"]',
    command: '[data-test="input-command"]',
    /**
     * `ix-user-combobox`, a library `tn-autocomplete`: the input is
     * `autocomplete-<control>` and its rows `option-<control>-<username>`.
     */
    user: '[data-test="autocomplete-user"]',
    userOption: (username: string): string => `[data-test="option-user-${kebabTestSegment(username)}"]`,
    /** `ix-scheduler` renders a `tn-select` with `[testId]="[controlName, 'presets']"`. */
    schedule: '[data-test="select-schedule-presets"]',
    scheduleOption: (label: string): string => (
      `[data-test="option-schedule-presets-${kebabTestSegment(label)}"]`
    ),
    /** "Hide Standard Output". Ticked by default. */
    hideStdout: '[data-test="checkbox-stdout"]',
    enabled: '[data-test="checkbox-enabled"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /** `CronDeleteDialog`, the card's own dialog rather than webui's shared confirm. */
  deleteDialog: {
    /** `<tn-dialog-shell testId="cron-delete">`. What to wait on before acting on it. */
    title: '[data-test="dialog-title-cron-delete"]',
    confirm: '[data-test="button-delete"]',
  },
} as const;
