/**
 * The Alert Services table on System > Alert Settings, its form and its delete dialog.
 *
 * Every id on a row is built from the list's own `uniqueRowTag`,
 * `alert-service-<name>`, run through `convertStringToId` and then the library's
 * normalizer. The two agree on every name the suite uses, so
 * {@link kebabTestSegment} is the one to use throughout. The tag is keyed on the
 * name alone, so an edit that leaves the name alone never renames the row.
 *
 * Every column is an `ix-table-text-cell`, Enabled included — a translated Yes/No
 * rendered as text — so every cell id ends `row-text`, not `row-yesno`.
 *
 * The list asks for `mode="inline"`, so Edit and Delete are icon buttons on the
 * row rather than items in a kebab menu, and their ids have no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`alert-service-${name}`);
}

export const alertServiceLocators = {
  list: {
    /** `<tn-button [testId]="['alert-service', 'add']">` in the card header. */
    add: '[data-test="button-alert-service-add"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    /** The Service Name cell. The column is `name`, but its title — the id's base — is "Service Name". */
    name: (name: string): string => `[data-test="text-service-name-${rowTag(name)}-row-text"]`,

    /** The type's label, e.g. `Slack`, not the wire value. */
    type: (name: string): string => `[data-test="text-type-${rowTag(name)}-row-text"]`,

    /** The level's label, e.g. `Critical`, not the wire value. */
    level: (name: string): string => `[data-test="text-level-${rowTag(name)}-row-text"]`,

    enabled: (name: string): string => `[data-test="text-enabled-${rowTag(name)}-row-text"]`,

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
  },

  form: {
    name: '[data-test="input-name"]',
    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',

    /**
     * Options come from `alertServiceNames` and are keyed by their label, so
     * Slack is `option-type-slack`. The form opens on AWS SNS.
     */
    type: '[data-test="select-type"]',
    typeSlack: '[data-test="option-type-slack"]',

    /** Options are keyed by the level's label, so Critical is `option-level-critical`. Opens on Warning. */
    level: '[data-test="select-level"]',
    levelOption: (label: string): string => `[data-test="option-level-${kebabTestSegment(label)}"]`,

    /**
     * Slack's Webhook URL, `<tn-input [testId]="'url'">` in the child form the type
     * renders into the Settings section. Required.
     */
    slackUrl: '[data-test="input-url"]',

    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
