/**
 * The API Keys list under Credentials > Users, its form and the dialog that
 * shows a new key.
 *
 * The list's row tag is `toUniqueRowTag('api-key-' + name)`, which lodash-kebabs
 * the whole tag before the library sees it — so the row and its cells go through
 * {@link legacyKebabTestSegment}: `e2e-api-key-target` is
 * `api-key-e-2-e-api-key-target` there. The row's own buttons do not: they are
 * `<tn-icon-button [testId]="['delete', row.name]">`, composed by the library, so
 * the same name is `button-delete-e2e-api-key-target` through
 * {@link kebabTestSegment}. Same name, two spellings, one row.
 *
 * Unlike most lists, the actions are inline icon buttons, not a kebab menu.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return legacyKebabTestSegment(`api-key-${name}`);
}

export const apiKeyLocators = {
  /** `<tn-button testId="add-api-key">` in the page header. */
  add: '[data-test="button-add-api-key"]',

  row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

  /** The Username cell, titled "Username". */
  username: (name: string): string => `[data-test="text-username-${rowTag(name)}-row-text"]`,

  /** The Expires On cell: a relative date such as "in 3mo", or "Never". */
  expiresOn: (name: string): string => `[data-test="text-expires-on-${rowTag(name)}-row-relative-date"]`,

  /** Edit, inline on the row beside Delete. A revoked key has none. */
  edit: (name: string): string => `[data-test="button-edit-${kebabTestSegment(name)}"]`,

  /** Delete, inline on the row. */
  delete: (name: string): string => `[data-test="button-delete-${kebabTestSegment(name)}"]`,

  form: {
    name: '[data-test="input-name"]',
    /**
     * `ix-user-combobox` with `[testId]="'username'"`, which renders a library
     * `tn-autocomplete`: the input is `autocomplete-username` and its rows are
     * `option-username-<label>` — the same shape as the S3 access key form.
     * Shown only to a full admin, which the suite signs in as.
     */
    username: '[data-test="autocomplete-username"]',
    usernameOption: (username: string): string => `[data-test="option-username-${kebabTestSegment(username)}"]`,
    /** Checked by default: a new key does not expire unless asked to. */
    nonExpiring: '[data-test="checkbox-non-expiring"]',
    /** `<tn-date-input [testId]="'expires-at'">`, rendered only while Non-expiring is unchecked. */
    expiresAt: '[data-test="date-input-expires-at"]',
    /** Its three typable segments, reached by class as in `locators/s3.ts`. */
    expiresAtMonth: '[data-test="date-input-expires-at"] input.tn-date-segment-month',
    expiresAtDay: '[data-test="date-input-expires-at"] input.tn-date-segment-day',
    expiresAtYear: '[data-test="date-input-expires-at"] input.tn-date-segment-year',
    /** Rendered only when editing, and only to the key's owner or a full admin. */
    reset: '[data-test="checkbox-reset"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    closePanel: '[data-test="button-close-side-panel"]',
  },

  /**
   * `<tn-dialog-shell testId="key-created">`, raised once after a key is
   * created. The key is in a read-only `tn-input` and is shown nowhere else.
   * That input is `[multiline]="true"`, which renders a `<textarea>` typed
   * `textarea`, so `testId="api-key"` emits `textarea-api-key`, not `input-api-key`.
   */
  keyCreatedDialog: {
    title: '[data-test="dialog-title-key-created"]',
    key: '[data-test="textarea-api-key"]',
    close: '[data-test="button-close"]',
  },
} as const;
