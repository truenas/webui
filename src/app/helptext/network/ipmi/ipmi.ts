import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  password_placeholder: T('Password'),
  password_validation: Validators.maxLength(20),
  password_errors: T('20 characters is the maximum length.'),
  password_tooltip: T('Enter the password used to connect to the IPMI\
 interface from a web browser.'),

  conf_password_placeholder: T('Confirm Password'),

  dhcp_placeholder: 'DHCP',
  dhcp_tooltip: T('Use DHCP. Unset to manually configure a static IPv4 connection.'),

  ipaddress_placeholder: T('IPv4 Address'),
  ipaddress_tooltip: T('Static IPv4 address of the IPMI web interface.'),

  netmask_placeholder: T('IPv4 Netmask'),
  netmask_tooltip: T('Subnet mask of the IPv4 address.'),

  gateway_placeholder: T('IPv4 Default Gateway'),
  gateway_tooltip: T('Enter the default gateway of the IPv4 connection.'),

  ip_error: T('Enter a valid IPv4 address.'),

  vlan_placeholder: T('VLAN ID'),
  vlan_tooltip: T('If the IPMI out-of-band management interface is on a\
 different VLAN from the management network, enter the IPMI VLAN.'),

  ipmi_configuration: T('IPMI Configuration'),
  ipmi_password_reset: T('IPMI Password Reset'),

  ipmi_remote_controller: T('Remote Controller'),

  ipmiOptions: [
    { label: T('Indefinitely'), value: 'force' },
    { label: T('15 seconds'), value: 15 },
    { label: T('30 seconds'), value: 30 },
    { label: T('1 minute'), value: 60 },
    { label: T('2 minute'), value: 120 },
    { label: T('3 minute'), value: 180 },
    { label: T('4 minute'), value: 240 },
    { label: T('Turn OFF'), value: 0 },
  ],
};
