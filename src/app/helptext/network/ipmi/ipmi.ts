import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextIpmi = {
  password_errors: T('20 characters is the maximum length.'),
  password_tooltip: T('Enter the password used to connect to the IPMI\
 interface from a web browser.'),

  dhcp_tooltip: T('Use DHCP. Unset to manually configure a static IPv4 connection.'),

  ipaddress_tooltip: T('Static IPv4 address of the IPMI web interface.'),

  netmask_tooltip: T('Subnet mask of the IPv4 address.'),

  gateway_tooltip: T('Enter the default gateway of the IPv4 connection.'),

  ip_error: T('Enter a valid IPv4 address.'),

  vlan_tooltip: T('If the IPMI out-of-band management interface is on a\
 different VLAN from the management network, enter the IPMI VLAN.'),

  ipmi_configuration: T('IPMI Configuration'),
  ipmi_password_reset: T('IPMI Password Reset'),

  ipmi_remote_controller: T('Remote Controller'),
};
