/**
 * The Tunable card on System > Advanced Settings (sysctl variables), and its form. Row ids come from
 * `uniqueRowTag`, `tunable-<var>`, with no pre-normalizing, so use {@link kebabTestSegment}, which keeps `ipv4`
 * whole where lodash would split it. Keyed on the variable, which the form disables once saved, so edits never
 * rename the row. The form is `ix-form-renderer` from `tunable.form-config.ts`, so ids are control names; Value is
 * a multiline `tn-input` rendering a `<textarea>` typed `textarea`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(variable: string): string {
  return kebabTestSegment(`tunable-${variable}`);
}

export const tunableLocators = {
  /**
   * Also the full list's rows, cells and menus: the list's tag is
   * `convertStringToId('tunable-' + var)`, which the library's normalizer turns
   * into the same `tunable-<var>` the card's plain tag becomes.
   */
  card: {
    /**
     * The card's title, a link to the full list: an anchor projected into the card
     * header with `tnTestIdType="link"` and `['tunable', 'open-in-new']`.
     */
    title: '[data-test="link-tunable-open-in-new"]',

    /** `<tn-button [testId]="['tunable', 'add']">` in the card footer. */
    add: '[data-test="button-tunable-add"]',

    row: (variable: string): string => `[data-test="row-${rowTag(variable)}"]`,

    value: (variable: string): string => `[data-test="text-value-${rowTag(variable)}-row-text"]`,

    /** The Enabled cell, a translated Yes/No — hence the `row-yesno` suffix. */
    enabled: (variable: string): string => `[data-test="text-enabled-${rowTag(variable)}-row-yesno"]`,

    /** The Description cell. The column is `comment`, but its title — the id's base — is "Description". */
    description: (variable: string): string => (
      `[data-test="text-description-${rowTag(variable)}-row-text"]`
    ),

    /**
     * The row's action menu trigger. A kebab menu rather than inline buttons:
     * the row has two actions and the card does not ask for `mode="inline"`.
     */
    rowMenu: (variable: string): string => `[data-test="button-${rowTag(variable)}-more-action"]`,

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (variable: string): string => (
      `[data-test="button-${rowTag(variable)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (variable: string): string => (
      `[data-test="button-${rowTag(variable)}-more-action-mdi-delete-row-action"]`
    ),
  },

  /**
   * The full list at `/system/tunable` (`tunable-list.component.html`). Its rows
   * are addressed through {@link tunableLocators.card} — see the note there. Its
   * search turns the `_` in a variable into a space before matching, so a query
   * with an underscore never matches a variable name.
   */
  list: {
    /** The page header's own Add, `[testId]="'add-tunable'"`. Not the card's `tunable-add`. */
    add: '[data-test="button-add-tunable"]',
  },

  form: {
    /**
     * Options come from `tunable.tunable_type_choices`, whose labels are the
     * values themselves, so Sysctl's option is keyed by `SYSCTL`. Disabled on edit.
     */
    type: '[data-test="select-type"]',
    typeSysctl: '[data-test="option-type-sysctl"]',
    /** Disabled on edit. */
    variable: '[data-test="input-var"]',
    value: '[data-test="textarea-value"]',
    comment: '[data-test="input-comment"]',
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
