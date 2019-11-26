import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
lldp_intdesc_placeholder : T('Interface Description'),
lldp_intdesc_tooltip: T('Set to enable <i>receive</i> mode. Any received peer\
 information is saved in interface descriptions.'),

lldp_country_placeholder : T('Country Code'),
lldp_country_tooltip: T('Required for <a href="--docurl--/services.html#lldp"\
 target="_blank">LLDP</a> location support. Enter a\
 two-letter ISO 3166 country code.'),
lldp_country_validation_error: T('Leave this field blank or enter exactly two letters.'),

lldp_location_placeholder : T('Location'),
lldp_location_tooltip: T('Specify the physical location of the host.')
}
