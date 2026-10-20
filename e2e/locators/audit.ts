/**
 * The Audit card on System > Advanced Settings, and its form.
 *
 * The card has no rows: each setting is a readout tagged `tnTestIdType="text"`,
 * so its id is static. Each holds a single value, without its label, and reads
 * `None` when the value is 0.
 *
 * The form is built by `ix-form-renderer` from `audit.form-config.ts`, so every
 * field's id is its control name through the library normalizer — see
 * `locators/tunable.ts`.
 *
 * The Audit page under System is the log itself, a `tn-table` whose row tag is
 * `audit-<service>-<username>-<event>-<audit id>` through lodash. Every record's
 * id is a UUID, so the tag is unique and is split at each letter/digit boundary.
 *
 * Above the log sit the Service selector, the search box and Export
 * (`audit-search.component.html`). The search box is the shared
 * `ix-search-input`: a plain input in basic mode, a CodeMirror editor in
 * advanced mode. Clicking a row opens Log Details beside the list, whose
 * readouts are static ids because the page shows one record at a time.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

/** The fields of an audit record that its row tag is built from. */
export interface AuditRowKey {
  audit_id: string;
  service: string;
  username: string;
  event: string;
}

/**
 * `memoizedRowTag` in `audit-list.component.ts`. The app lowercases before lodash
 * runs, so this does too: lodash alone would split a mixed-case username such as
 * `jDoe` at its hump, where the app keeps it whole.
 */
const rowTag = (record: AuditRowKey): string => legacyKebabTestSegment(
  `audit-${record.service}-${record.username}-${record.event}-${record.audit_id}`.toLowerCase(),
);

export const auditLocators = {
  list: {
    /** The `<tr>`, from `[rowTestId]`. */
    row: (record: AuditRowKey): string => `[data-test="row-${rowTag(record)}"]`,
    /** The User cell, which shows the username. */
    user: (record: AuditRowKey): string => `[data-test="text-user-${rowTag(record)}-row-text"]`,
    /** The Event cell, which shows middleware's event name verbatim (`METHOD_CALL`). */
    event: (record: AuditRowKey): string => `[data-test="text-event-${rowTag(record)}-row-text"]`,
    /** Every row's Service cell, which shows the service's label (`Middleware`), not its key. */
    anyService: '[data-test^="text-service-audit-"]',
    /** Every row's User cell. */
    anyUser: '[data-test^="text-user-audit-"]',
    /** Every row's Event cell. */
    anyEvent: '[data-test^="text-event-audit-"]',
  },

  search: {
    /** `<tn-select testId="audit-service">`. */
    service: '[data-test="select-audit-service"]',
    /** One of its options, by label: `SMB`, `Middleware`, `Sudo` or `System`. */
    serviceOption: (label: string): string => `[data-test="option-audit-service-${kebabTestSegment(label)}"]`,
    /** Basic mode's box, `<tn-input [testId]="'search'">`. */
    basic: '[data-test="input-search"]',
    /** The link beside the basic box that swaps in the advanced editor. */
    switchToAdvanced: '[data-test="button-switch-to-advanced"]',
    /** The advanced editor's container. CodeMirror mounts inside it, and a click there focuses the editor. */
    advanced: '[data-test="input-advanced-search"]',
    /** Under the advanced editor while the query does not parse: `Syntax error at <from>-<to>`. */
    queryError: '[data-test="text-query-error"]',
    /** `<tn-button testId="search">` beside the box. Runs whichever query is showing. */
    run: '[data-test="button-search"]',
  },

  exporting: {
    /** The arrow beside Export that opens the format menu. Rendered only while the log has rows. */
    formatMenu: '[data-test="button-export-format-selector"]',
    /** A format in that menu, `[testId]="['format', format]"` with `CSV`, `JSON` or `YAML`. */
    format: (format: string): string => `[data-test="button-format-${kebabTestSegment(format)}"]`,
    /** `ix-export-button`'s `<tn-button testId="export">`, labelled `Export As <format>`. */
    exportButton: '[data-test="button-export"]',
  },

  details: {
    service: '[data-test="text-service"]',
    event: '[data-test="text-event"]',
    user: '[data-test="text-user"]',
    auditId: '[data-test="text-audit-id"]',
  },

  card: {
    /** `<n> days`. */
    retention: '[data-test="text-audit-retention"]',
    /** `<n> GiB`, or `None`. */
    reservation: '[data-test="text-audit-reservation"]',
    /** `<n> GiB`, or `None`. */
    quota: '[data-test="text-audit-quota"]',
    /** `<n>%`. */
    quotaFillWarning: '[data-test="text-audit-quota-fill-warning"]',
    /** `<n>%`. */
    quotaFillCritical: '[data-test="text-audit-quota-fill-critical"]',
    /** `<tn-button [testId]="['audit', 'configure']">` in the card footer. */
    configure: '[data-test="button-audit-configure"]',
  },

  form: {
    retention: '[data-test="input-retention"]',
    reservation: '[data-test="input-reservation"]',
    quota: '[data-test="input-quota"]',
    quotaFillWarning: '[data-test="input-quota-fill-warning"]',
    quotaFillCritical: '[data-test="input-quota-fill-critical"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
