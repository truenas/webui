/**
 * The Interfaces card on System > Network, the interface form it opens, and the
 * pending-changes card the page shows above it while an edit is staged.
 */
import { kebabTestSegment, legacyKebabTestSegment } from './test-id';

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
 * "Add Interface" and "Edit Interface", one form. Every control falls back to its
 * `formControlName`, and every select's options are keyed by label. Save is
 * `haInterfaceLocators.form.save`, which `saveInterface` in `flows/ha.ts` presses.
 */
export const interfaceFormLocators = {
  /** Shown only when adding. Options are keyed by label: `Bridge`, `Link Aggregation`, `VLAN`. */
  type: '[data-test="select-type"]',
  typeOption: (label: string): string => `[data-test="option-type-${kebabTestSegment(label)}"]`,
  /** Read-only when editing. */
  name: '[data-test="input-name"]',
  description: '[data-test="input-description"]',
  /**
   * The `ipv4_dhcp` radio for DHCP. Its sibling, and why the base is spelled
   * `ipv-4-dhcp`, is `haInterfaceLocators.form.staticAddresses`.
   */
  dhcp: '[data-test="radio-button-ipv-4-dhcp-get-ip-address-automatically-from-dhcp"]',
  mtu: '[data-test="input-mtu"]',
  /** Shown only when editing, with `NETWORK_FEC`, and once `interface.available_fec_modes` named a mode. */
  fecMode: '[data-test="select-fec-mode"]',
  fecModeOptions: '[data-test^="option-fec-mode-"]',

  /** VLAN Settings, shown once the type is VLAN. Parents are keyed by label, the NIC's name. */
  vlanParent: '[data-test="select-vlan-parent-interface"]',
  vlanParentOption: (name: string): string => `[data-test="option-vlan-parent-interface-${kebabTestSegment(name)}"]`,
  vlanTag: '[data-test="input-vlan-tag"]',

  /** Bridge Settings, shown once the type is Bridge. Members are a multiple select of interface names. */
  bridgeMembers: '[data-test="select-bridge-members"]',
  bridgeMembersOptions: '[data-test^="option-bridge-members-"]',
  bridgeMemberOption: (name: string): string => `[data-test="option-bridge-members-${kebabTestSegment(name)}"]`,
  /** On by default. */
  enableLearning: '[data-test="checkbox-enable-learning"]',

  /** Link Aggregation, shown once the type is Link Aggregation. */
  lagProtocol: '[data-test="select-lag-protocol"]',
  lagProtocolOption: (label: string): string => `[data-test="option-lag-protocol-${kebabTestSegment(label)}"]`,
  /** Shown for LACP and LOADBALANCE. */
  xmitHashPolicy: '[data-test="select-xmit-hash-policy"]',
  /** Shown for LACP only. */
  lacpduRate: '[data-test="select-lacpdu-rate"]',
  lacpduRateOptions: '[data-test^="option-lacpdu-rate-"]',
  lacpduRateOption: (label: string): string => `[data-test="option-lacpdu-rate-${kebabTestSegment(label)}"]`,
  /** A multiple select for every protocol but FAILOVER, which has an ordered listbox instead. */
  lagPorts: '[data-test="select-lag-ports"]',
  lagPortsOptions: '[data-test^="option-lag-ports-"]',
  lagPortOption: (name: string): string => `[data-test="option-lag-ports-${kebabTestSegment(name)}"]`,
  /**
   * FAILOVER's ordered listbox: one switch per port, `toggle-` + `lag-ports` +
   * the port's name, through webui's legacy normalizer, so `ens4` is `ens-4`.
   */
  lagFailoverPort: (name: string): string => `[data-test="toggle-lag-ports-${legacyKebabTestSegment(name)}"]`,
  /** The switch's own checkbox, which is what reports whether the port is chosen. */
  lagFailoverPortCheckbox: (name: string): string => {
    return `[data-test="toggle-lag-ports-${legacyKebabTestSegment(name)}"] input[type="checkbox"]`;
  },

  /** The side panel is opened with no `testId`, so this is the panel's generic close. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;

/**
 * The card above Interfaces while `interface.has_pending_changes` is true.
 * Test Changes and the timeout field show until a commit is waiting for its
 * check-in, Save Changes only while one is. Revert Changes shows throughout.
 */
export const pendingChangesLocators = {
  checkinTimeout: '[data-test="input-checkin-timeout"]',
  /** Shown in place of the timeout field while a commit waits: the seconds left, counting down. */
  checkinRemaining: '[data-test="text-checkin-remaining"]',
  testChanges: '[data-test="button-test-changes"]',
  saveChanges: '[data-test="button-save-changes"]',
  revertChanges: '[data-test="button-revert-changes"]',
} as const;

/**
 * "Set Gateway and DNS", `<tn-dialog-shell testId="default-gateway">`. The form
 * opens it after a save whenever `interface.network_config_to_be_removed` names
 * a gateway or DNS servers DHCP provides — on an appliance that takes them from
 * DHCP, after any save that stages a change, a new VLAN with no addresses
 * included. `answerGatewayDialog` in `flows/network-interfaces.ts` reads that
 * call rather than assuming the dialog. Prefilled with
 * them: Register saves them as static configuration, Skip saves nothing.
 */
export const defaultGatewayDialogLocators = {
  title: '[data-test="dialog-title-default-gateway"]',
  gateway: '[data-test="input-default-gateway"]',
  register: '[data-test="button-register"]',
  /** Labelled Skip, `testId="cancel"`. */
  skip: '[data-test="button-cancel"]',
} as const;
