/**
 * The Init/Shutdown Scripts card on System > Advanced Settings, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `card-init-shutdown-<command>-<when>`, written as a plain template literal
 * with no pre-normalizing — so the row, its cells and its action menu all go
 * through the library's normalizer, and {@link kebabTestSegment} is the one to
 * use throughout. The tag carries the command, so **editing the command or the
 * When renames every id on the row**; a spec that edits either looks the row
 * up again under the new values.
 *
 * The form is a hand-written template whose controls fall back to their
 * `formControlName`, so the field ids read like the API's own keys.
 */
import { kebabTestSegment } from './test-id';

/** Middleware's values for `when`, which is what the row tag is built from. */
export type InitShutdownWhen = 'PREINIT' | 'POSTINIT' | 'SHUTDOWN';

/** The labels the When select shows, which is what its option ids are keyed by. */
export const initShutdownWhenLabels: Record<InitShutdownWhen, string> = {
  PREINIT: 'Pre Init',
  POSTINIT: 'Post Init',
  SHUTDOWN: 'Shutdown',
};

function rowTag(command: string, when: InitShutdownWhen): string {
  return kebabTestSegment(`card-init-shutdown-${command}-${when}`);
}

export const initShutdownLocators = {
  card: {
    /** `<tn-button [testId]="['init-shutdown', 'add']">` in the card footer. */
    add: '[data-test="button-init-shutdown-add"]',

    row: (command: string, when: InitShutdownWhen): string => `[data-test="row-${rowTag(command, when)}"]`,

    /** The Description cell. Titled "Description", so its base is `text-description`. */
    description: (command: string, when: InitShutdownWhen): string => (
      `[data-test="text-description-${rowTag(command, when)}-row-text"]`
    ),

    /**
     * The row's action menu trigger. A kebab menu rather than inline buttons:
     * the row has two actions and the card does not ask for `mode="inline"`.
     */
    rowMenu: (command: string, when: InitShutdownWhen): string => (
      `[data-test="button-${rowTag(command, when)}-more-action"]`
    ),

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (command: string, when: InitShutdownWhen): string => (
      `[data-test="button-${rowTag(command, when)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (command: string, when: InitShutdownWhen): string => (
      `[data-test="button-${rowTag(command, when)}-more-action-mdi-delete-row-action"]`
    ),
  },

  /**
   * The warning Advanced Settings raises the first time an admin opens any of
   * its forms in a session — `DialogService.warn`, which renders the shared info
   * dialog. Held in memory by `FirstTimeWarningService`, so a fresh page always
   * sees it once and never twice.
   */
  firstTimeWarning: {
    title: '[data-test="text-info-title"]',
    close: '[data-test="button-dialog-close"]',
  },

  form: {
    comment: '[data-test="input-comment"]',
    /** Shown only while Type is Command, which is the default. */
    command: '[data-test="input-command"]',
    when: '[data-test="select-when"]',
    whenOption: (when: InitShutdownWhen): string => (
      `[data-test="option-when-${kebabTestSegment(initShutdownWhenLabels[when])}"]`
    ),
    timeout: '[data-test="input-timeout"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
