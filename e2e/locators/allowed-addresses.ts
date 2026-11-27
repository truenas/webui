/**
 * The Allowed IP Addresses card on System > Advanced Settings, and its Configure form. Row ids come from
 * `uniqueRowTag`, `allowed-address-<address>`, through the library normalizer, so use {@link kebabTestSegment}
 * (`allowed-address-198-51-100-0-24`). The row's one action, Delete, renders inline with no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function rowTag(address: string): string {
  return kebabTestSegment(`allowed-address-${address}`);
}

export const allowedAddressesLocators = {
  card: {
    /** `<tn-button [testId]="['configure', 'ip-address']">` in the card footer. */
    configure: '[data-test="button-configure-ip-address"]',

    row: (address: string): string => `[data-test="row-${rowTag(address)}"]`,

    address: (address: string): string => `[data-test="text-address-${rowTag(address)}-row-text"]`,

    /** The row's own Delete button — the row tag, the icon, library and all, then `row-action`. */
    delete: (address: string): string => `[data-test="button-${rowTag(address)}-mdi-delete-row-action"]`,
  },

  form: {
    /** "Add" under the list: `tn-form-list` names it `['add-item', label]`; the label is "Allowed IP Addresses". */
    add: '[data-test="button-add-item-allowed-ip-addresses"]',
    /** An address, by its position. A form array's controls are named `0`, `1`, …, and the input has no `testId`. */
    address: (index: number): string => `[data-test="input-${index}"]`,
    /** `<tn-form-field [testId]="['address', i]">` around {@link address}: its label and, once refused, the reason. */
    addressField: (index: number): string => `[data-test="form-field-address-${index}"]`,
    /** `<tn-button [testId]="'save'">` on the side panel container. */
    save: '[data-test="button-save"]',
    closePanel: '[data-test="button-close-side-panel"]',
  },
} as const;
