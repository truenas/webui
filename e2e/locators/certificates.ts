/**
 * The Certificate Signing Requests card on Credentials > Certificates, and its
 * Add CSR wizard.
 *
 * Every id on a row is built from the card's own `uniqueRowTag`, `csr-<name>`, a
 * plain concatenation with no pre-normalizing, so {@link kebabTestSegment} is the
 * one to use throughout. A CSR's name may hold only letters, digits, `_` and `-`.
 *
 * Each cell is tagged `[('<Title>' | translate), uniqueRowTag(row), 'row-text']`.
 * The CN column renders two of them, one for the common name and one for the
 * SANs, each only when the row has a value for it.
 *
 * The card's actions are icon buttons on the row, so their ids have no
 * `more-action`.
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

    /** The row's own Delete button: the row tag, the icon, library and all, then `row-action`. */
    delete: (name: string): string => `[data-test="button-${rowTag(name)}-mdi-delete-row-action"]`,
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
