import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
password_placeholder : T('Password'),
password_validation: Validators.maxLength(20),
password_errors: T('20 characters is the maximum length.'),
password_tooltip : T('Enter the password used to connect to the IPMI\
 interface from a web browser.'),

conf_password_placeholder: T('Confirm Password'),
conf_password_validation : [ matchOtherValidator('password') ],

dhcp_placeholder : T('DHCP'),
dhcp_tooltip : T('Use DHCP. Unset to manually configure a static IPv4 connection.'),

ipaddress_placeholder : T('IPv4 Address'),
ipaddress_tooltip : T('Static IPv4 address of the IPMI web interface.'),

netmask_placeholder : T('IPv4 Netmask'),
netmask_tooltip : T('Subnet mask of the IPv4 address.'),

gateway_placeholder : T('IPv4 Default Gateway'),
gateway_tooltip : T('Enter the default gateway of the IPv4 connection.'),

vlan_placeholder : T('VLAN ID'),
vlan_tooltip : T('If the IPMI out-of-band management interface is on a\
 different VLAN from the management network, enter the IPMI VLAN.')

}