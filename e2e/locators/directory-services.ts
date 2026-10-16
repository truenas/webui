/**
 * Credentials > Directory Services: its Advanced Settings, the Kerberos Realms
 * and Kerberos Keytab cards inside them, and the two cards' forms.
 *
 * Every id on a row is built from its card's own `uniqueRowTag` —
 * `kerberos-realm-<realm>` and `kerberos-keytab-<name>` — run through
 * `convertStringToId` and then the library's normalizer. `convertStringToId`
 * lowercases **first**, so the tag is lowercased here before
 * {@link kebabTestSegment} sees it: on the raw name that splits a digit from the
 * capital after it, and realm `E2E-REALM.TEST` would come out `e2-e-realm-test`
 * where the app renders `kerberos-realm-e2e-realm-test`.
 *
 * Both cards ask for `mode="inline"`, so Edit and Delete are icon buttons on the
 * row rather than items in a kebab menu, and their ids have no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function realmRowTag(realm: string): string {
  return kebabTestSegment(`kerberos-realm-${realm}`.toLowerCase());
}

function keytabRowTag(name: string): string {
  return kebabTestSegment(`kerberos-keytab-${name}`.toLowerCase());
}

export const directoryServicesLocators = {
  /**
   * `<tn-button [testId]="'show-advanced-settings'">`. Pressing it opens the
   * panel and raises webui's shared confirm with `hideCheckbox: true`; cancelling
   * that closes the panel again.
   */
  showAdvancedSettings: '[data-test="button-show-advanced-settings"]',

  realms: {
    /** `<tn-button [testId]="'add-kerberos-realms'">` in the card footer. */
    add: '[data-test="button-add-kerberos-realms"]',

    row: (realm: string): string => `[data-test="row-${realmRowTag(realm)}"]`,

    realm: (realm: string): string => `[data-test="text-realm-${realmRowTag(realm)}-row-text"]`,

    /** The KDC list, joined with `, `. */
    kdc: (realm: string): string => `[data-test="text-kdc-${realmRowTag(realm)}-row-text"]`,

    /** The admin server list, joined with `, `. */
    adminServer: (realm: string): string => `[data-test="text-admin-server-${realmRowTag(realm)}-row-text"]`,

    /** The password server list, joined with `, `. */
    passwordServer: (realm: string): string => (
      `[data-test="text-password-server-${realmRowTag(realm)}-row-text"]`
    ),

    /** The row's own Edit button — the row tag, the icon, library and all, then `row-action`. */
    edit: (realm: string): string => `[data-test="button-${realmRowTag(realm)}-mdi-pencil-row-action"]`,

    /** The row's own Delete button. Same shape as {@link edit}. */
    delete: (realm: string): string => `[data-test="button-${realmRowTag(realm)}-mdi-delete-row-action"]`,
  },

  realmForm: {
    realm: '[data-test="input-realm"]',
    primaryKdc: '[data-test="input-primary-kdc"]',
    /** `tn-chip-input testId="kdc"`: the typable field; Enter commits the text as a chip. */
    kdc: '[data-test="chip-input-kdc"]',
    /** Same shape as {@link kdc}. */
    adminServer: '[data-test="chip-input-admin-server"]',
    /** Same shape as {@link kdc}. */
    passwordServer: '[data-test="chip-input-kpasswd-server"]',
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
  },

  keytabs: {
    /** `<tn-button [testId]="'add-kerberos-keytabs'">` in the card footer. */
    add: '[data-test="button-add-kerberos-keytabs"]',

    row: (name: string): string => `[data-test="row-${keytabRowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${keytabRowTag(name)}-row-text"]`,

    /** The row's own Delete button — the row tag, the icon, library and all, then `row-action`. */
    delete: (name: string): string => `[data-test="button-${keytabRowTag(name)}-mdi-delete-row-action"]`,
  },

  keytabForm: {
    name: '[data-test="input-name"]',
    /**
     * The `tn-file-input` host, pinned to the legacy `input-file` id at the call
     * site. The id is on the host, not on the native `<input type="file">` inside
     * it, and the Choose File button inside carries none of its own.
     */
    file: '[data-test="input-file"]',
    save: '[data-test="button-save"]',
  },
} as const;
