/**
 * The Network Configuration card on System > Network and the Settings form it opens.
 *
 * The card is `network-configuration-card.component.html` and the form is
 * `network-configuration.component.html`. The form opens in a side panel, so Save
 * and the close button belong to the panel rather than to the form.
 *
 * Every form control is bound by control name with no `testId`, so its id falls
 * back to that name: `input-nameserver1`, `checkbox-inherit-dhcp`. A `tn-chip-input`
 * puts its id on the typable field inside it, as `chip-input-<name>`.
 */

export const networkConfigLocators = {
  card: {
    /** "Settings" in the card footer. Opens the form. */
    settings: '[data-test="button-network-settings"]',
    /** `hostname_local`, which is `hostname` on a single controller. */
    hostname: '[data-test="text-hostname"]',
    /** The domain, or "Inherit from DHCP" while none is set. */
    domain: '[data-test="text-domain"]',
    /** The additional search domains, joined with ", ", or "-". */
    additionalDomains: '[data-test="text-additional-domains"]',
    /** The host entries, joined with ", ", or "-". */
    hostnameDatabase: '[data-test="text-hostname-database"]',
    /** The announcements switched on, of "NETBIOS-NS", "mDNS" and "WS-DISCOVERY", joined with ", ". */
    serviceAnnouncement: '[data-test="text-service-announcement"]',
  },

  form: {
    hostname: '[data-test="input-hostname"]',
    /** "Inherit domain from DHCP". While ticked, Domain is disabled and saved empty. */
    inheritDhcp: '[data-test="checkbox-inherit-dhcp"]',
    domain: '[data-test="input-domain"]',
    /** "Additional Domains". Enter commits the typed text as a chip. */
    domains: '[data-test="chip-input-domains"]',
    netbios: '[data-test="checkbox-netbios"]',
    mdns: '[data-test="checkbox-mdns"]',
    wsd: '[data-test="checkbox-wsd"]',
    /**
     * Filled with the nameserver DHCP handed out when none is stored, so saving the
     * form stores that one.
     */
    nameserver1: '[data-test="input-nameserver1"]',
    nameserver2: '[data-test="input-nameserver2"]',
    nameserver3: '[data-test="input-nameserver3"]',
    /** The field around Nameserver 1: its label and, once refused, the reason. */
    nameserver1Field: '[data-test="form-field-nameserver1"]',
    /** Filled from the live default route when none is stored, like the nameservers. */
    ipv4gateway: '[data-test="input-ipv4gateway"]',
    /** The field around the IPv4 gateway: its label and, once refused, the reason. */
    ipv4gatewayField: '[data-test="form-field-ipv4gateway"]',
    /** "Host Name Database", one `<address> <name>` entry per chip. */
    hosts: '[data-test="chip-input-hosts"]',
  },

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
