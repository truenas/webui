import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
int_interface_placeholder : T('NIC'),
int_interface_tooltip : T('Enter the FreeBSD device name of the interface. This\
 cannot change after creating the interface.'),
int_interface_validation : [ Validators.required ],

int_name_placeholder : T('Description'),
int_name_tooltip : T('Enter a description of the interface.'),
int_name_validation : [ Validators.required ],

int_dhcp_placeholder : T('DHCP'),
int_dhcp_tooltip : T('Set to enable DHCP. Leave unset to create a static\
 IPv4 or IPv6 configuration. Only one interface can\
 be configured for DHCP.'),

int_ipv4address_placeholder : T('IPv4 Address'),
int_ipv4address_tooltip : T('Enter a static IPv4 address. Example: <i>10.0.0.2</i>.'),

int_v4netmaskbit_placeholder : T('IPv4 Netmask'),
int_v4netmaskbit_tooltip : T('Enter a netmask.'),

int_ipv6auto_placeholder : T('Auto configure IPv6'),
int_ipv6auto_tooltip : T('Set to automatically configure the IPv6 address with\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=rtsol"\
 target="_blank">rtsol(8)</a>. Only one interface can\
 be configured this way.'),

int_ipv6address_placeholder : T('IPv6 Address'),
int_ipv6address_tooltip : T('Enter a static IPv6 address. Example:\
 <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>.'),

int_v6netmaskbit_placeholder : T('IPv6 Prefix Length'),
int_v6netmaskbit_tooltip : T('Select the prefix length used on the network.'),

int_options_placeholder : T('Options'),
int_options_tooltip : T('Enter additional space-delimited parameters from <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ifconfig"\
 target="_blank">ifconfig(8)</a>.'),

alias_address_placeholder: T('IPv4 Address'),
alias_address_tooltip: T('Enter a static IPv4 address. Example:\
 <i>10.0.0.3</i>.'),

alias_netmaskbit_placeholder: T('IPv4 Netmask'),
alias_netmaskbit_tooltip : T('Enter a netmask.'),

delete_placeholder: T('Delete'),
delete_tooltip: T('Set to delete this alias.'),

alias_address6_placeholder: T('IPv6 Address'),
alias_address6_tooltip: T('Enter a static IPv6 address if DHCP is unset.\
 Example: <i>2001:0db8:85a3:0000:0000:8a2e:0370:7334</i>'),

alias_netmaskbit6_placeholder: T('IPv6 Prefix Length'),
alias_netmaskbit6_tooltip : T('Select the prefix length used on the network.'),

delete_placeholder6: T('Delete'),
delete_tooltip6: T('Set to delete this alias.'),

}
