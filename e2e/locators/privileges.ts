/**
 * The list on Credentials > Privileges, and its form.
 *
 * Every id on a row is built from the list's own `uniqueRowTag`, `privilege-<name>`,
 * a plain concatenation with no pre-normalizing, so {@link kebabTestSegment} is the
 * one to use throughout. The tag is keyed on the name alone, so an edit that leaves
 * the name alone never renames the row.
 *
 * Each cell is a span tagged `[('<Title>' | translate), uniqueRowTag(row), '<kind>']`,
 * so its id is the column's title, then the row tag, then the kind of cell.
 *
 * The list asks for `mode="inline"`, so Edit and Delete are icon buttons on the row
 * rather than items in a kebab menu, and their ids have no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`privilege-${name}`);
}

export const privilegeLocators = {
  list: {
    /** `<tn-button [testId]="'add-privilege'">` in the page header. */
    add: '[data-test="button-add-privilege"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    /** The roles' labels, comma-separated — `Sharing Admin`, not the wire value. */
    roles: (name: string): string => `[data-test="text-roles-${rowTag(name)}-row-text"]`,

    /** How many local groups the privilege names, as a plain count. */
    localGroups: (name: string): string => `[data-test="text-local-groups-${rowTag(name)}-row-text"]`,

    /** A translated Yes/No through the `yesNo` pipe, tagged `row-yesno`. */
    webShell: (name: string): string => `[data-test="text-web-shell-access-${rowTag(name)}-row-yesno"]`,

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}, and absent on a built-in privilege. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  form: {
    name: '[data-test="input-name"]',

    /**
     * `<tn-select formControlName="roles" [multiple]="true" [testId]="'roles'">`. Options
     * come from `privilege.roles` and are keyed by their label, so Readonly Admin is
     * `option-roles-readonly-admin`.
     */
    roles: '[data-test="select-roles"]',
    roleOption: (label: string): string => `[data-test="option-roles-${kebabTestSegment(label)}"]`,

    webShell: '[data-test="checkbox-web-shell"]',

    /**
     * Directory Services Groups, `<ix-group-chips formControlName="ds_groups" [testId]="'ds-groups'">`.
     * Rendered unless `DIRECTORY_SERVICES_AUTH` is explicitly denied. Its options are the domain's
     * groups by full name, `NAME\domain users`; on save the form resolves the names to gids.
     */
    dsGroups: '[data-test="chip-input-ds-groups"]',
    dsGroupOption: (group: string): string => `[data-test="option-ds-groups-${kebabTestSegment(group)}"]`,

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
