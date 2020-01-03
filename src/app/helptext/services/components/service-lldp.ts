import { T } from '../../../translate-marker';

export default {
lldp_intdesc_placeholder : T('Interface Description'),
lldp_intdesc_tooltip: T('Enables <i>receive</i> mode. Any received peer \
 information is saved in interface descriptions.'),

lldp_country_placeholder : T('Country Code'),
lldp_country_tooltip: T('Two-letter <a \
 href="https://www.iso.org/obp/ui/#search/code/" target="_blank">ISO 3166-1 alpha-2 code</a> \
 used to enable LLDP location support.'),
lldp_country_validation_error: T('Country Code must be blank or have a \
 valid two-letter <a \
 href="https://www.iso.org/obp/ui/#search/code/" target="_blank">ISO 3166-1 alpha-2 code</a>.'),

lldp_location_placeholder : T('Location'),
lldp_location_tooltip: T('The physical location of the host.')
}
