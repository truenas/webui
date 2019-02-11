import { T } from '../../translate-marker';

export default {

step1_label: T('Name Jail and Choose FreeBSD Release'),

uuid_placeholder: T('Jail Name'),
uuid_tooltip: T('Required. Can only contain alphanumeric characters \
Aa-Zz 0-9), dashes (-), or underscores (_).'),

jailtype_placeholder: T('Jail Type'),
jailtype_tooltip: T('<i>Default (Clone Jail)</i> or <i>Basejail</i>. \
Clone jails are clones of the specified RELEASE. They are linked to \
that RELEASE, even if they are upgraded. Basejails mount the \
specified RELEASE directories as nullfs mounts over the jail \
directories. Basejails are not linked to the original RELEASE \
when upgraded.'),

release_placeholder: T('Release'),
release_tooltip: T('Choose the FreeBSD release to use as the jail \
operating system. Releases that have already \
been downloaded show <b>(fetched)</b>.'),

step2_label: T('Configure Networking'),

dhcp_placeholder: T('DHCP Autoconfigure IPv4'),
dhcp_tooltip: T('Set to autoconfigure jail networking with the \
Dynamic Host Configuration Protocol. <b>VNET</b> \
is required.'),

vnet_placeholder: T('VNET'),
vnet_tooltip: T('Set to use <a \
href="https://www.freebsd.org/cgi/man.cgi?query=vnet&sektion=9" \
target="_blank">VNET(9)</a> to emulate network \
devices for the jail. \
A fully virtualized per-jail network stack will be \
installed.'),

ip4_interface_placeholder: T('IPv4 Interface'),
ip4_interface_tooltip: T('IPv4 interface for the jail.'),

ip4_addr_placeholder: T('IPv4 Address'),
ip4_addr_tooltip: T('IPv4 address for the jail.'),

ip4_netmask_placeholder: T('IPv4 Netmask'),
ip4_netmask_tooltip: T('IPv4 netmask for the jail.'),

defaultrouter_placeholder: T('IPv4 Default Router'),
defaultrouter_tooltip: T('A valid IPv4 address to use as the default route. \
<br>Enter <b>none</b> to configure the jail with \
no IPv4 default route. <br>\
<b>A jail without a default route will not be \
able to access any networks.</b>'),

auto_configure_ip6_placeholder: T('Autoconfigure IPv6'),
auto_configure_ip6_tooltip: T('Set to use SLAAC (Stateless Address Auto \
Configuration) to autoconfigure IPv6 in the jail.'),

ip6_interface_placeholder: T('IPv6 Interface'),
ip6_interface_tooltip: T('IPv6 interface for the jail.'),

ip6_addr_placeholder: T('IPv6 Address'),
ip6_addr_tooltip: T('IPv6 address for the jail.'),

ip6_prefix_placeholder: T('IPv6 Prefix'),
ip6_prefix_tooltip: T('IPv6 prefix for the jail.'),

defaultrouter6_placeholder: T('IPv6 Default Router'),
defaultrouter6_tooltip: T('A valid IPv6 address to use as the default route. \
<br>Enter <b>none</b> to configure the jail without \
an IPv6 default route. <br>\
<b>A jail without a default route will not be able \
to access any networks.</b>'),

}
