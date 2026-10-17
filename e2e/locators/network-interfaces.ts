/**
 * The Interfaces card on System > Network, the interface form it opens, and the
 * pending-changes card the page shows above it while an edit is staged.
 */
import { kebabTestSegment } from './test-id';

/**
 * An interface's row tag: `convertStringToId('interface-' + name)`, as the
 * library normalizes it. Every cell and action id on the row is built from it.
 */
function interfaceTag(name: string): string {
  return kebabTestSegment(`interface-${name}`);
}

export const interfacesCardLocators = {
  /** "Add", `[testId]="['add', 'interface']"`. */
  add: '[data-test="button-add-interface"]',

  row: (name: string): string => `[data-test="row-${interfaceTag(name)}"]`,
  /** Name, with the description in brackets after it when there is one. */
  name: (name: string): string => `[data-test="text-name-${interfaceTag(name)}-row-text"]`,
  /** Every `INET`/`INET6` address as `address/netmask`; DHCP leases come from `state.aliases`. */
  ipAddresses: (name: string): string => `[data-test="text-ip-addresses-${interfaceTag(name)}-row-text"]`,
  /** `state.permanent_link_address`. */
  macAddress: (name: string): string => `[data-test="text-mac-address-${interfaceTag(name)}-row-text"]`,

  /**
   * Every row has two actions, so both collapse behind this trigger: Edit and
   * Reset on a physical NIC, Edit and Delete on anything else. Each item's id
   * is the trigger's with the icon appended.
   */
  menu: (name: string): string => `[data-test="button-${interfaceTag(name)}-more-action"]`,
  edit: (name: string): string => `[data-test="button-${interfaceTag(name)}-more-action-mdi-pencil-row-action"]`,
  reset: (name: string): string => `[data-test="button-${interfaceTag(name)}-more-action-mdi-refresh-row-action"]`,
  delete: (name: string): string => `[data-test="button-${interfaceTag(name)}-more-action-mdi-delete-row-action"]`,
} as const;

/**
 * "Add Interface". Every control falls back to its `formControlName`. Save is
 * `haInterfaceLocators.form.save`, which `saveInterface` in `flows/ha.ts` presses.
 */
export const interfaceFormLocators = {
  /** Shown only when adding. Options are keyed by label: `Bridge`, `Link Aggregation`, `VLAN`. */
  type: '[data-test="select-type"]',
  typeOption: (label: string): string => `[data-test="option-type-${kebabTestSegment(label)}"]`,
  name: '[data-test="input-name"]',
  description: '[data-test="input-description"]',

  /** VLAN Settings, shown once the type is VLAN. Parents are keyed by label, the NIC's name. */
  vlanParent: '[data-test="select-vlan-parent-interface"]',
  vlanParentOption: (name: string): string => `[data-test="option-vlan-parent-interface-${kebabTestSegment(name)}"]`,
  vlanTag: '[data-test="input-vlan-tag"]',
} as const;

/**
 * The card above Interfaces while `interface.has_pending_changes` is true.
 * Test Changes and the timeout field show until a commit is waiting for its
 * check-in, Save Changes only while one is. Revert Changes shows throughout.
 */
export const pendingChangesLocators = {
  checkinTimeout: '[data-test="input-checkin-timeout"]',
  testChanges: '[data-test="button-test-changes"]',
  saveChanges: '[data-test="button-save-changes"]',
  revertChanges: '[data-test="button-revert-changes"]',
} as const;
