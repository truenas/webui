/**
 * The Init/Shutdown Scripts card on System > Advanced Settings, and its form. Row ids come from `uniqueRowTag`,
 * `card-init-shutdown-<command>-<when>`, with no pre-normalizing, so use {@link kebabTestSegment}. Editing the
 * command or When renames every id on the row; look it up again under the new values. Form controls fall back
 * to their `formControlName`, so ids read like the API's keys.
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

/**
 * The full list's row tag, `init-shutdown-<command>-<type>`: the type where the
 * card has When, so **a row on the list keeps its ids when When changes**. Only
 * command scripts are made here, so the type is always `COMMAND`.
 */
function listRowTag(command: string): string {
  return kebabTestSegment(`init-shutdown-${command}-COMMAND`);
}

export const initShutdownLocators = {
  card: {
    /**
     * The card's title, a link to the full list: an anchor projected into the card
     * header with `tnTestIdType="link"` and `['init-shutdown', 'open-in-new']`.
     */
    title: '[data-test="link-init-shutdown-open-in-new"]',

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
   * The full list at `/system/initshutdown` (`init-shutdown-list.component.html`).
   * No search. It shows Type and Command/Script, which the card does not, and
   * its kebab opens the card's form with no first-time warning in front of it.
   */
  list: {
    /** The page header's own Add, `[testId]="'add-init-shutdown-script'"`. */
    add: '[data-test="button-add-init-shutdown-script"]',

    row: (command: string): string => `[data-test="row-${listRowTag(command)}"]`,

    /** The type's label, `Command` or `Script`. */
    type: (command: string): string => `[data-test="text-type-${listRowTag(command)}-row-text"]`,

    /** The command, for a command script. */
    script: (command: string): string => `[data-test="text-command-script-${listRowTag(command)}-row-text"]`,

    /** The When's label, e.g. `Shutdown`. */
    when: (command: string): string => `[data-test="text-when-${listRowTag(command)}-row-text"]`,

    description: (command: string): string => `[data-test="text-description-${listRowTag(command)}-row-text"]`,

    rowMenu: (command: string): string => `[data-test="button-${listRowTag(command)}-more-action"]`,

    /** Edit, inside that menu. */
    rowMenuEdit: (command: string): string => (
      `[data-test="button-${listRowTag(command)}-more-action-mdi-pencil-row-action"]`
    ),
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
