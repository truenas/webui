/**
 * The list on Credentials > Privileges, and its form. Row ids come from `uniqueRowTag`, `privilege-<name>`, with no
 * pre-normalizing, so use {@link kebabTestSegment}; keyed on the name alone, so other edits keep the row id. Cells
 * are `[('<Title>' | translate), uniqueRowTag(row), '<kind>']`. `mode="inline"` makes Edit and Delete row icon
 * buttons with no `more-action`.
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
