/**
 * The Boot Environments list on System > Boot, its clone form and its delete dialog.
 *
 * Every id on a row is built from the list's own `uniqueRowTag`, `bootenv-<name>`,
 * a plain template literal with no pre-normalizing — so the row, its cells and its
 * actions all go through the library's normalizer, the same as `locators/tunable.ts`.
 * A boot environment's name is its id, and nothing on this page renames one.
 *
 * The list asks for `mode="inline"`, so a row's actions are buttons on the row
 * rather than a kebab menu: the row tag, the icon with its library, then `row-action`.
 * Keep and Unkeep are two actions, one hidden at a time — Keep is `bookmark-outline`.
 *
 * The clone form is built by `ix-form-renderer` from `bootenv.form-config.ts`, so
 * every field's id is its control name — see `locators/groups.ts`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`bootenv-${name}`);
}

export const bootEnvironmentLocators = {
  list: {
    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    /** The Keep cell, a translated Yes/No — hence the `row-yesno` suffix. */
    keep: (name: string): string => `[data-test="text-keep-${rowTag(name)}-row-yesno"]`,

    clone: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-content-copy-row-action"]`,

    /** Hidden once the flag is set, when Unkeep (`mdi-bookmark`) takes its place. */
    keepAction: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-bookmark-outline-row-action"]`,

    /** Hidden on the running boot environment and the one set to boot next. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  cloneForm: {
    target: '[data-test="input-target"]',
    /** Prefilled with the row the form was opened from, and disabled. */
    source: '[data-test="input-source"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  /**
   * `BootPoolDeleteDialog`, not webui's shared confirm. `<tn-dialog-shell testId="boot-pool-delete">`.
   *
   * Its Cancel declares `testId="save"`, so `button-save` inside it is Cancel; nothing here uses it.
   */
  deleteDialog: {
    title: '[data-test="dialog-title-boot-pool-delete"]',
    /** One line per boot environment the dialog will delete. */
    item: (name: string): string => `[data-test="text-boot-environment-${kebabTestSegment(name)}"]`,
    confirm: '[data-test="checkbox-confirm"]',
    /**
     * The dialog's own Delete. The list's batch toolbar emits the same id, but only
     * while rows are selected, and the flows here never select one.
     */
    delete: '[data-test="button-delete"]',
  },
} as const;
