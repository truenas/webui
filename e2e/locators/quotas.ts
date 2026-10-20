/**
 * The User Quotas and Group Quotas pages of a dataset, and their add and edit forms.
 *
 * Both pages are one component, `dataset-quotas-list`, routed twice. Every id on a row is built
 * from its `uniqueRowTag`, `<users|groups>-quota-<name>`, run through `convertStringToId` and then
 * the library's normalizer. The tag is keyed on the name alone, so editing a quota never renames
 * its row. The list asks for `mode="inline"`, so Edit and Delete are icon buttons on the row.
 *
 * By default the list shows only principals with a quota set, so a row exists exactly while one
 * does. Show All also lists every principal middleware reports with none.
 */
import { kebabTestSegment } from './test-id';
import type { QuotaKind } from '../fixtures/quotas';

function rowTag(kind: QuotaKind, name: string): string {
  return kebabTestSegment(`${kind}s-quota-${name}`);
}

/** The tag of a row whose uid or gid maps to no name, which falls back to `id-<id>`. */
function unmappedRowTag(kind: QuotaKind, id: number): string {
  return rowTag(kind, `id-${id}`);
}

/** `<tn-slide-toggle [testId]="'show-all-' + helpTextKey">` in the page header. */
function showAll(kind: QuotaKind): string {
  return `[data-test="toggle-show-all-${kind}s"]`;
}

export const quotaLocators = {
  /**
   * "Manage User Quotas" / "Manage Group Quotas" on the selected dataset's Space Management card.
   * `tnTestIdType="link"` with `[dataset().id, 'manage-<kind>-quotas']`. Rendered only for an
   * unlocked, writable filesystem.
   */
  manage: (dataset: string, kind: QuotaKind): string => (
    `[data-test="link-${kebabTestSegment(dataset)}-manage-${kind}-quotas"]`
  ),

  list: {
    /** `<tn-button [testId]="'add-quota'">` in the page header. */
    add: '[data-test="button-add-quota"]',

    /**
     * Show All Users / Show All Groups. Switching it either way raises a confirm, and a cancelled
     * one switches it back.
     */
    showAll,
    /** The switch's own checkbox, which is what holds whether it is on. */
    showAllState: (kind: QuotaKind): string => `${showAll(kind)} input[type="checkbox"]`,

    /**
     * `<tn-button [testId]="'remove-invalid-quotas'">`, rendered only while the dataset holds a
     * quota for a uid or gid that maps to no user or group.
     */
    removeInvalid: '[data-test="button-remove-invalid-quotas"]',

    row: (kind: QuotaKind, name: string): string => `[data-test="row-${rowTag(kind, name)}"]`,

    /** The row of a uid or gid that maps to no name, as a deleted user's quota is. */
    unmappedRow: (kind: QuotaKind, id: number): string => `[data-test="row-${unmappedRowTag(kind, id)}"]`,

    /** The Name cell of {@link unmappedRow}, which shows `—`. */
    unmappedName: (kind: QuotaKind, id: number): string => (
      `[data-test="text-name-${unmappedRowTag(kind, id)}-row-text"]`
    ),

    /** The Object Quota cell. A plain count, so it reads the same in any locale. */
    objectQuota: (kind: QuotaKind, name: string): string => (
      `[data-test="text-object-quota-${rowTag(kind, name)}-row-text"]`
    ),

    /** The row's own Edit button: the row tag, the icon with its library, then `row-action`. */
    edit: (kind: QuotaKind, name: string): string => `[data-test="button-${rowTag(kind, name)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}, and only on a row with a quota set. */
    delete: (kind: QuotaKind, name: string): string => (
      `[data-test="button-${rowTag(kind, name)}-mdi-delete-row-action"]`
    ),
  },

  form: {
    /**
     * Edit only. `<tn-input formControlName="name" [readonly]="true">`, patched with the user or
     * group name once the quota has loaded, so it is the signal that the form is ready.
     */
    name: '[data-test="input-name"]',
    /** `<tn-input formControlName="data_quota">`, a size input that reads `1 GiB` and the like. */
    dataQuota: '[data-test="input-data-quota"]',
    /** `<tn-input formControlName="obj_quota">`. */
    objectQuota: '[data-test="input-obj-quota"]',
    /**
     * Add only. `ix-user-chips formControlName="users"` / `ix-group-chips formControlName="groups"`,
     * whose id sits on the `tn-chip-input` text field inside it.
     */
    principals: (kind: QuotaKind): string => `[data-test="chip-input-${kind}s"]`,
    /**
     * Add only. The field around {@link principals}, `testId="users"` / `testId="groups"`, which
     * holds the existence check's error text.
     */
    principalsField: (kind: QuotaKind): string => `[data-test="form-field-${kind}s"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
