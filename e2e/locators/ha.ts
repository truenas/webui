/**
 * What an HA setup drives: the license, the data interface's failover
 * addresses, the Failover card and form, and the controls that report and
 * move HA once it is on.
 */
import { interfacesCardLocators, pendingChangesLocators } from './network-interfaces';

/** The Support card on System > General Settings, and its License side panel. */
export const licenseLocators = {
  /** `[testId]="'set-license'"`: "Add License" until there is one, "Update License" after. */
  setLicense: '[data-test="button-set-license"]',
  /** A multiline `tn-input`, so a `<textarea>`: `textarea-license`, not `input-license`. */
  license: '[data-test="textarea-license"]',
  save: '[data-test="button-save"]',
} as const;

/**
 * The interfaces card on System > Network, the interface form, and the
 * Test / Save Changes the page asks for before a network change is kept.
 */
export const haInterfaceLocators = {
  /** An interface's row, and the Edit behind its action menu: see `locators/network-interfaces.ts`. */
  row: interfacesCardLocators.row,
  menu: interfacesCardLocators.menu,
  edit: interfacesCardLocators.edit,

  form: {
    /** The `ipv4_dhcp` radios, whose base is spelled `ipv-4-dhcp` to keep the legacy ids. */
    staticAddresses: '[data-test="radio-button-ipv-4-dhcp-define-static-ip-addresses"]',
    /** "Add" under Static IP Addresses: `tn-form-list` adds `add-item` and its label. */
    addAddress: '[data-test="button-add-item-static-ip-addresses"]',
    /**
     * The alias's address, `ix-ip-input-with-netmask` with no `testId`: the
     * bare address goes in the input and the prefix in the select beside it.
     * Typed as `a.b.c.d/nn` into the input instead, it is invalid.
     */
    address: '[data-test="input-address"]',
    netmask: '[data-test="select-netmasks"]',
    netmaskOption: (bits: number): string => `[data-test="option-netmasks-${bits}"]`,
    /** Shown only once the system is HA licensed: the other controller's address. */
    failoverAddress: '[data-test="input-failover-address"]',
    /** Shown only once HA licensed: the VIP. */
    virtualAddress: '[data-test="input-failover-virtual-address"]',
    /** The Failover section, shown only once HA licensed. */
    critical: '[data-test="checkbox-failover-critical"]',
    group: '[data-test="select-failover-group"]',
    groupOption: (group: number): string => `[data-test="option-failover-group-${group}"]`,
    save: '[data-test="button-save"]',
  },

  /**
   * "Set Gateway and DNS", which the form opens after saving when the change
   * drops a gateway or DNS servers DHCP had provided. Prefilled with them.
   */
  gatewayDialog: {
    gateway: '[data-test="input-default-gateway"]',
    register: '[data-test="button-register"]',
  },

  /** The pending-changes card on the Network page. */
  pending: pendingChangesLocators,
} as const;

/** The Failover card on System > Advanced Settings, shown once HA licensed, and its form. */
export const failoverLocators = {
  card: {
    /** Labelled Enabled: `Yes` or `No` (the `yesNo` pipe). */
    enabled: '[data-test="text-failover-enabled"]',
    configure: '[data-test="button-failover-configure"]',
  },
  form: {
    /** "Enable Automatic Failover": `disabled` inverted. */
    enabled: '[data-test="checkbox-enabled"]',
    /** Its confirmation asks for the Confirm box and offers "Restart standby" as the second. */
    syncToPeer: '[data-test="button-sync-to-peer"]',
    save: '[data-test="button-save"]',
  },
} as const;

/** What reports HA's state, and the one control that moves it. */
export const haStatusLocators = {
  /**
   * The topbar's HA icon, shown once HA licensed. Enabled when
   * `failover.disabled.reasons` is empty; reconnecting while the first reason
   * is the peer not being ready, as while it reboots; disabled otherwise.
   */
  indicatorEnabled: '[data-test="button-ha-indicator-enabled"]',
  indicatorReconnecting: '[data-test="button-ha-indicator-reconnecting"]',
  indicatorDisabled: '[data-test="button-ha-indicator-disabled"]',
  /**
   * "Initiate Failover", on the Dashboard's "System Information – Standby"
   * widget only. Enabled once nothing in the disabled reasons forbids it.
   */
  initiateFailover: '[data-test="button-initiate-failover"]',
  /** The splash the app shows while it fails over: "System is failing over...". */
  systemTaskMessage: '[data-test="text-system-task-message"]',
} as const;
