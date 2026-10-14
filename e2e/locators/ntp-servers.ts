/**
 * The NTP Servers card on System > Advanced Settings, and its form.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`,
 * `ntp-server-<address>-<minpoll>-<maxpoll>`, a plain template literal with no
 * pre-normalizing — so the row, its cells and its action menu all go through the
 * library's normalizer, and {@link kebabTestSegment} is the one to use
 * throughout. An IPv4 address loses its dots to it: `192.0.2.10` becomes
 * `192-0-2-10`.
 *
 * The tag carries both poll intervals, so **an edit that changes either one
 * renames every id on the row**. A spec that edits them looks the row up again
 * under the new values.
 *
 * The form is built by `ix-form-renderer` from `ntp-servers.form-config.ts`, so
 * every field's id is its control name — see `locators/groups.ts`.
 */
import { kebabTestSegment } from './test-id';

/** What the card keys a row on. */
export interface NtpServerRowKey {
  address: string;
  minpoll: number;
  maxpoll: number;
}

function rowTag({ address, minpoll, maxpoll }: NtpServerRowKey): string {
  return kebabTestSegment(`ntp-server-${address}-${minpoll}-${maxpoll}`);
}

export const ntpServerLocators = {
  card: {
    /** `<tn-button [testId]="'add-ntp'">` in the card footer. */
    add: '[data-test="button-add-ntp"]',

    row: (key: NtpServerRowKey): string => `[data-test="row-${rowTag(key)}"]`,

    address: (key: NtpServerRowKey): string => `[data-test="text-address-${rowTag(key)}-row-text"]`,

    /** The Burst cell, a translated Yes/No — hence the `row-yesno` suffix. */
    burst: (key: NtpServerRowKey): string => `[data-test="text-burst-${rowTag(key)}-row-yesno"]`,

    /** The Prefer cell. Same shape as {@link burst}. */
    prefer: (key: NtpServerRowKey): string => `[data-test="text-prefer-${rowTag(key)}-row-yesno"]`,

    minPoll: (key: NtpServerRowKey): string => `[data-test="text-min-poll-${rowTag(key)}-row-text"]`,

    maxPoll: (key: NtpServerRowKey): string => `[data-test="text-max-poll-${rowTag(key)}-row-text"]`,

    /**
     * The row's action menu trigger. A kebab menu rather than inline buttons:
     * the row has two actions and the card does not ask for `mode="inline"`.
     */
    rowMenu: (key: NtpServerRowKey): string => `[data-test="button-${rowTag(key)}-more-action"]`,

    /** Edit, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuEdit: (key: NtpServerRowKey): string => (
      `[data-test="button-${rowTag(key)}-more-action-mdi-pencil-row-action"]`
    ),

    /** Delete, inside that menu. Same shape as {@link rowMenuEdit}. */
    rowMenuDelete: (key: NtpServerRowKey): string => (
      `[data-test="button-${rowTag(key)}-more-action-mdi-delete-row-action"]`
    ),
  },

  form: {
    address: '[data-test="input-address"]',
    /** Unticked by default. */
    burst: '[data-test="checkbox-burst"]',
    /** Ticked by default. */
    iburst: '[data-test="checkbox-iburst"]',
    /** Unticked by default. */
    prefer: '[data-test="checkbox-prefer"]',
    /** A number input, 6 by default. */
    minpoll: '[data-test="input-minpoll"]',
    /** A number input, 10 by default. */
    maxpoll: '[data-test="input-maxpoll"]',
    /**
     * Saves a server middleware cannot reach. Not a stored field, so it starts
     * unticked on edit as well as on add.
     */
    force: '[data-test="checkbox-force"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },
} as const;
