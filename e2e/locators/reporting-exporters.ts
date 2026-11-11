/**
 * Reporting > Exporters (`/reportsdashboard/exporters`): the list and its Add/Edit side panel. Row ids come from
 * `uniqueRowTag`, `reporting-exporter-<name>`, via `convertStringToId` then the library normalizer, which agree on
 * every name the suite uses, so use {@link kebabTestSegment}; keyed on the name alone. Edit and Delete are row
 * `tn-icon-button`s, `['edit', row tag, 'row-action']`: verb first, no icon name.
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
