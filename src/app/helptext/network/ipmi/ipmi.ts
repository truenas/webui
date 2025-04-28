import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextIpmi = {
  passwordLengthError: T('20 characters is the maximum length.'),
  passwordTooltip: T('Enter the password used to connect to the IPMI\
 interface from a web browser.'),

  dhcpTooltip: T('Use DHCP. Unset to manually configure a static IPv4 connection.'),

  ipAddressTooltip: T('Static IPv4 address of the IPMI web interface.'),

  netmaskTooltip: T('Subnet mask of the IPv4 address.'),

  vlanTooltip: T('If the IPMI out-of-band management interface is on a\
 different VLAN from the management network, enter the IPMI VLAN.'),

  ipmiConfiguration: T('IPMI Configuration'),
  ipmiPasswordReset: T('IPMI Password Reset'),

  ipmiRemoteController: T('Remote Controller'),
};
