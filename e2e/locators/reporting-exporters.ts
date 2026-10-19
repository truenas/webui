/**
 * Reporting > Exporters (`/reportsdashboard/exporters`): the exporter list, and the side panel its
 * Add and Edit open.
 *
 * Every id on a row is built from the list's own `uniqueRowTag`, `reporting-exporter-<name>`, run
 * through `convertStringToId` and then the library's normalizer. The two agree on every name the
 * suite uses, so {@link kebabTestSegment} is the one to use. The tag is keyed on the name alone, so
 * an edit that leaves the name alone never renames the row.
 *
 * Edit and Delete are `tn-icon-button`s on the row, `['edit', row tag, 'row-action']`, so the verb
 * comes first and there is no icon name in the id.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`reporting-exporter-${name}`);
}

export const reportingExportersLocators = {
  /** `<tn-button testId="exporters-nav">` in the Reporting page's header controls. */
  openExporters: '[data-test="button-exporters-nav"]',

  list: {
    add: '[data-test="button-add-reporting-exporter"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,
    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,
    /** The raw `attributes.exporter_type`, e.g. `GRAPHITE`, not a label. */
    type: (name: string): string => `[data-test="text-type-${rowTag(name)}-row-text"]`,

    /**
     * The checkbox inside the row's Enabled slide toggle, which is checked while the exporter is
     * enabled. `tn-slide-toggle` puts its `toggle-` type in front. Read here, never clicked: the
     * toggle saves on its own, and that journey is not this suite's.
     */
    enabled: (name: string): string => (
      `[data-test="toggle-enabled-${rowTag(name)}-row-toggle"] input[type="checkbox"]`
    ),

    edit: (name: string): string => `[data-test="button-edit-${rowTag(name)}-row-action"]`,
    delete: (name: string): string => `[data-test="button-delete-${rowTag(name)}-row-action"]`,
  },

  form: {
    name: '[data-test="input-name"]',
    /** The field around {@link name}, which holds middleware's refusal of it. */
    nameField: '[data-test="form-field-name"]',

    /** Options are the schema keys, untranslated, so Graphite is `option-type-graphite`. Opens empty. */
    type: '[data-test="select-type"]',
    typeGraphite: '[data-test="option-type-graphite"]',

    /** Ticked by default. */
    enabled: '[data-test="checkbox-enabled"]',

    /**
     * Graphite's attributes. `ix-dynamic-form` gives each control its schema `_name_` as its
     * `testId`, and renders the ones for the selected type only.
     */
    destinationIp: '[data-test="input-destination-ip"]',
    destinationPort: '[data-test="input-destination-port"]',
    namespace: '[data-test="input-namespace"]',

    /** The side panel's Save. Disabled while the form is invalid. */
    save: '[data-test="button-save"]',
  },
} as const;
