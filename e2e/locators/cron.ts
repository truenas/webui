/**
 * The Cron Jobs card on System > Advanced Settings, its form and its delete dialog. Row ids come from
 * `uniqueRowTag`, `card-cron-<command>-<user>`, with no pre-normalizing, so use {@link kebabTestSegment}. Editing
 * the command renames every id on the row (look it up again); the description isn't in the tag, so two jobs
 * with one command and user share ids, and the specs keep commands distinct. Form fields fall back to their
 * `formControlName`, so `stdout`/`stderr` keep the API names despite the "Hide Standard ..." labels.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/**
 * A schedule preset's option is keyed by its whole label, which is the preset's
 * name and its description run together. Hourly is the one whose description
 * carries no time of day — the others format midnight for the browser's locale,
 * so their ids are not knowable in advance.
 */
export const hourlyScheduleLabel = 'Hourly At the start of each hour';

/**
 * `ix-scheduler`'s select and the `ix-scheduler-modal` custom schedule dialog, shared by every task form. The
 * select is `[testId]="[controlName, 'presets']"`: `schedule` on most forms, `cloudsync_picker` on cloud sync,
 * `schedule_picker` on replication. Dialog inputs fall back to `formControlName`; checkboxes are
 * `[testId]="['scheduler', label]"` keyed by the translated short label (`Sun`, `Jan`); Done is `testId="done"`.
 */
export const schedulerLocators = {
  presets: (control: string): string => `[data-test="select-${kebabTestSegment(control)}-presets"]`,
  /** The action option on {@link presets} that opens the dialog. */
  createCustom: (control: string): string => (
    `[data-test="option-${kebabTestSegment(control)}-presets-create-custom-schedule"]`
  ),
  minutes: '[data-test="input-minutes"]',
  hours: '[data-test="input-hours"]',
  /** "Days of Month". */
  days: '[data-test="input-days"]',
  /** A Days of Week checkbox, by its label: `Sun` … `Sat`. */
  weekday: (label: string): string => `[data-test="checkbox-scheduler-${kebabTestSegment(label)}"]`,
  /** Disabled while any field is invalid. Closes the dialog and hands the crontab to the select. */
  done: '[data-test="button-done"]',
} as const;

function rowTag(command: string, user: string): string {
  return kebabTestSegment(`card-cron-${command}-${user}`);
}

/**
 * The full list's row tag: `memoizedRowTag` over `cron-<command>-<description>`,
 * which pre-normalizes through lodash, so `e2e` is `e-2-e` here. It carries the
 * description rather than the user, so **editing the description renames the row**.
 */
function listRowTag(command: string, description: string): string {
  return legacyKebabTestSegment(`cron-${command}-${description}`);
}

export const cronLocators = {
  card: {
    /**
     * The card's title, a link to the full list: an anchor projected into the card
     * header with `tnTestIdType="link"` and `['cron', 'open-in-new']`.
     */
    title: '[data-test="link-cron-open-in-new"]',

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

  /**
   * The full list at `/system/cron` (`cron-list.component.html`). Its search
   * filters the Users column alone. A row has no action buttons of its own:
   * clicking it opens a detail row whose Run Now, Edit and Delete are keyed by the
   * job's id, and they open the card's form and dialog.
   */
  list: {
    /** The page header's own Add, `[testId]="'add-cronjob'"`. Not the card's `cron-add`. */
    add: '[data-test="button-add-cronjob"]',

    row: (command: string, description: string): string => (
      `[data-test="row-${listRowTag(command, description)}"]`
    ),

    /** The Command cell. Clicking it opens the row's detail row. */
    command: (command: string, description: string): string => (
      `[data-test="text-command-${listRowTag(command, description)}-row-text"]`
    ),

    description: (command: string, description: string): string => (
      `[data-test="text-description-${listRowTag(command, description)}-row-text"]`
    ),

    /** Edit in the detail row, `[testId]="[cronjob.id, 'edit']"`. */
    edit: (id: number): string => `[data-test="button-${id}-edit"]`,
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
