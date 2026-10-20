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
 *
 * The card's readouts are scoped inside the card, because the top bar renders its
 * own `text-hostname` and an unscoped locator matches both.
 *
 * Outbound Network is stored the other way round from how it reads: "Allow All"
 * saves `{ type: 'DENY', activities: [] }`, an empty deny list, and "Deny All"
 * saves an empty allow list. The component's own comment explains why.
 */
import { kebabTestSegment } from './test-id';

export type OutboundActivityLabel = 'Allow All' | 'Deny All' | 'Allow Specific' | 'Allow All Except';

const card = '[data-test="card-network-configuration"]';

export const networkConfigLocators = {
  card: {
    /** "Settings" in the card footer. Opens the form. */
    settings: '[data-test="button-network-settings"]',
    /** `hostname_local`, which is `hostname` on a single controller. */
    hostname: `${card} [data-test="text-hostname"]`,
    /** The domain, or "Inherit from DHCP" while none is set. */
    domain: `${card} [data-test="text-domain"]`,
    /** The additional search domains, joined with ", ", or "-". */
    additionalDomains: `${card} [data-test="text-additional-domains"]`,
    /** The host entries, joined with ", ", or "-". */
    hostnameDatabase: `${card} [data-test="text-hostname-database"]`,
    /** The announcements switched on, of "NETBIOS-NS", "mDNS" and "WS-DISCOVERY", joined with ", ". */
    serviceAnnouncement: `${card} [data-test="text-service-announcement"]`,
    /**
     * Read from the stored `activity`, not from the radio labels: "Allow All",
     * "Deny All", or "Only allow: " or "Allow all except: " and the activity values joined with ", ".
     */
    outboundNetwork: `${card} [data-test="text-outbound-network"]`,
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
    /**
     * An Outbound Network radio, by its label: "Allow All", "Deny All", "Allow
     * Specific" or "Allow All Except". The ids keep the legacy
     * `radio-button-<group>-<label>` shape — the template says why.
     */
    outboundActivity: (label: OutboundActivityLabel): string => (
      `[data-test="radio-button-outbound-network-activity-${kebabTestSegment(label)}"]`
    ),
    /** "Services", a multiple select shown only for the two Specific radios. */
    outboundServices: '[data-test="select-outbound-network-value"]',
    /** By the label `network.configuration.activity_choices` gives the activity. */
    outboundServicesOption: (label: string): string => (
      `[data-test="option-outbound-network-value-${kebabTestSegment(label)}"]`
    ),
  },

  /** The side panel's Save, `[testId]="'save'"` in form-side-panel-container. */
  save: '[data-test="button-save"]',
  /** The side panel's dismiss control. It asks first only when the form has unsaved edits. */
  closePanel: '[data-test="button-close-side-panel"]',
} as const;
