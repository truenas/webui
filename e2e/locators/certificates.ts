/**
 * The Certificates and Certificate Signing Requests cards on Credentials >
 * Certificates, the Import Certificate form, the Edit Certificate form, and the
 * dialog that shows a certificate's or key's PEM.
 *
 * What follows, down to {@link csrLocators}, describes the CSR card; the
 * Certificates card is described at {@link certificateLocators}.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`, `csr-<name>`, a
 * plain concatenation with no pre-normalizing, so {@link kebabTestSegment} is the
 * one to use throughout. A CSR's name may hold only letters, digits, `_` and `-`.
 *
 * Each cell is tagged `[('<Title>' | translate), uniqueRowTag(row), 'row-text']`.
 * The CN column renders two of them, one for the common name and one for the
 * SANs, each only when the row has a value for it.
 *
 * The card does not ask for `mode="inline"` and an admin sees all four of its row
 * actions, so they sit in a kebab menu behind the row's `more-action` trigger.
 */
import { kebabTestSegment } from './test-id';

function rowTag(name: string): string {
  return kebabTestSegment(`csr-${name}`);
}

/**
 * The card lists four CSRs before its Show More pager (`[pageSize]="4"`), oldest
 * first, so a fifth row is not on screen until the pager is used.
 */
export const csrCardPageSize = 4;

export const csrLocators = {
  list: {
    /** `<tn-button [testId]="['add-certificate-signing-request']">` in the card footer. */
    add: '[data-test="button-add-certificate-signing-request"]',

    row: (name: string): string => `[data-test="row-${rowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${rowTag(name)}-row-text"]`,

    common: (name: string): string => `[data-test="text-cn-${rowTag(name)}-row-text"]`,

    /** The SAN array, interpolated as it stands. */
    san: (name: string): string => `[data-test="text-san-${rowTag(name)}-row-text"]`,

    /** The row's kebab menu trigger. Its actions are Create ACME Certificate, Download, Edit and Delete. */
    rowMenu: (name: string): string => `[data-test="button-${rowTag(name)}-more-action"]`,

    /** Delete, inside that menu — the trigger's own id with the icon appended, library and all. */
    rowMenuDelete: (name: string): string => (
      `[data-test="button-${rowTag(name)}-more-action-mdi-delete-row-action"]`
    ),
  },

  /**
   * The wizard. `tn-stepper` renders only the active step, so the Next button every
   * step carries is one element at a time, and each step is told apart by a field
   * only it has.
   */
  wizard: {
    next: '[data-test="button-next"]',

    /** Identifier and Type. Type defaults to Certificate Signing Request. */
    name: '[data-test="input-name"]',

    /** Certificate Options: `<tn-select testId="key_type">`. RSA, 2048 and SHA256 by default. */
    keyType: '[data-test="select-key-type"]',

    /** Certificate Subject. Country defaults to US. */
    state: '[data-test="input-state"]',
    city: '[data-test="input-city"]',
    organization: '[data-test="input-organization"]',
    email: '[data-test="input-email"]',
    common: '[data-test="input-common"]',
    /** `tn-chip-input testId="san"`: the typable field; Enter commits the text as a chip. */
    san: '[data-test="chip-input-san"]',

    /** Extra Constraints. Every extension is off by default. */
    basicConstraints: '[data-test="checkbox-basic-constraints-enabled"]',

    /** Confirm Options. */
    save: '[data-test="button-save"]',
  },
} as const;

function certificateRowTag(name: string): string {
  return kebabTestSegment(`cert-${name}`);
}

/**
 * The Certificates card lists four certificates before its Show More pager
 * (`[pageSize]="4"`), oldest first, the same as the CSR card. A fresh appliance
 * holds one, `truenas_default`.
 */
export const certificateCardPageSize = 4;

/**
 * The Certificates card, built the same way as the CSR card: `uniqueRowTag` is
 * `cert-<name>`, a plain concatenation, and each cell is tagged
 * `[('<Title>' | translate), uniqueRowTag(row), 'row-text']`. Its three row
 * actions (Download, Edit, Delete) sit in a kebab menu.
 */
export const certificateLocators = {
  card: {
    /** `<tn-button [testId]="['import-certificate']">` in the card footer. */
    import: '[data-test="button-import-certificate"]',

    row: (name: string): string => `[data-test="row-${certificateRowTag(name)}"]`,

    name: (name: string): string => `[data-test="text-name-${certificateRowTag(name)}-row-text"]`,

    common: (name: string): string => `[data-test="text-cn-${certificateRowTag(name)}-row-text"]`,

    rowMenu: (name: string): string => `[data-test="button-${certificateRowTag(name)}-more-action"]`,

    rowMenuEdit: (name: string): string => (
      `[data-test="button-${certificateRowTag(name)}-more-action-mdi-pencil-row-action"]`
    ),

    rowMenuDelete: (name: string): string => (
      `[data-test="button-${certificateRowTag(name)}-more-action-mdi-delete-row-action"]`
    ),
  },

  /** The Import Certificate side panel. */
  importForm: {
    name: '[data-test="input-name"]',
    addToTrustedStore: '[data-test="checkbox-add-to-trusted-store"]',
    /**
     * Both PEM fields are multiline `tn-input`s, which render a `<textarea>` typed
     * `textarea` — see `locators/api-keys.ts`.
     */
    certificate: '[data-test="textarea-certificate"]',
    privateKey: '[data-test="textarea-privatekey"]',
    /** `<tn-button [testId]="'save'">` on the side panel container, labelled Import here. */
    save: '[data-test="button-save"]',
  },

  /** The Edit Certificate side panel, opened from a row's Edit. */
  editForm: {
    /** Labelled Identifier. */
    name: '[data-test="input-name"]',
    addToTrustedStore: '[data-test="checkbox-add-to-trusted-store"]',
    /**
     * The panel footer's Actions menu, `footerMenu` in `certificate-edit.component.ts`,
     * rendered by the side panel host as a `tn-icon-button` beside Save.
     */
    actions: '[data-test="button-certificate-actions"]',
    /** Its `tn-menu-item`s: View/Download Certificate, and View/Download Key. */
    viewCertificate: '[data-test="button-view-certificate-or-csr"]',
    viewKey: '[data-test="button-view-key"]',
    save: '[data-test="button-save"]',
  },

  /**
   * `<tn-dialog-shell testId="view-certificate">`, raised by
   * either menu item: one dialog for the certificate and the key alike, told apart
   * only by what its read-only textarea holds.
   */
  viewDialog: {
    title: '[data-test="dialog-title-view-certificate"]',
    pem: '[data-test="textarea-certificate"]',
    close: '[data-test="button-close"]',
  },
} as const;
