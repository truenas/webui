import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInterfacesForm = {
  int_type_tooltip: T('Choose the\
 type of interface. <i>Bridge</i> creates a logical link between\
 multiple networks. <i>Link Aggregation</i> combines multiple network\
 connections into a single interface. A <i>Virtual LAN (VLAN)</i> partitions\
 and isolates a segment of the connection. Read-only when editing an\
 interface.'),
  int_interface_tooltip: T('Enter the device name of the\
 interface. This cannot be changed after the interface is created.'),
  int_description_tooltip: T('Enter a description of the interface.'),
  int_name_tooltip: T('Enter a name for the interface.\
 Use the format <samp>bond<i>X</i></samp>,\
 <samp>vlan<i>X</i></samp>, or <samp>br<i>X</i></samp> where\
 <i>X</i> is a number representing a non-parent interface. Read-only\
 when editing an interface.'),
  int_dhcp_tooltip: T('Set to enable DHCP. Leave unset to create a static\
 IPv4 or IPv6 configuration. Only one interface can\
 be configured for DHCP.'),
  int_ipv6auto_tooltip: T('Set to automatically configure the IPv6. Only one interface can be configured this way.'),
  enable_learning_tooltip: T('Toggle off to defer interface learning until runtime, preventing premature state transitions and potential issues during system startup.'),
  alias_address_tooltip: T('Define an alias for the interface \
 on this TrueNAS controller. The alias can be an IPv4 or IPv6 \
 address.'),
  bridge_members_tooltip: T('Network interfaces to include in the bridge.'),
  bridge_stp_tooltip: T('Enable/Disable STP on the bridge interfaces configurable.'),
  failover_critical_tooltip: T('Interfaces marked <i>critical</i> are\
 considered necessary for normal operation. When the last critical\
 interface in a failover group is preempted by the other storage\
 controller through the VRRP or CARP protocols, a failover is\
 triggered.'),
  failover_group_tooltip: T('Combine multiple, critical-for-failover \
 interfaces into a group. Groups apply to single systems. A failover \
 occurs when every interface in the group fails. Groups with a single \
 interface trigger a failover when that interface fails. Configuring the \
 system to failover when any interface fails requires marking each \
 interface as critical and placing them in separate groups.'),
  failover_vhid_tooltip: T('Unique Virtual Host ID on the broadcast \
 segment of the network. Configuring multiple Virtual IP addresses \
 requires a separate VHID for each address.'),
  failover_alias_address_tooltip: T('Alias for the identical interface \
 on the other TrueNAS controller. The alias can be an IPv4 or IPv6 address.'),
  failover_virtual_alias_address_tooltip: T('Define an alias that can \
 connect to the interface on either TrueNAS controller. This address \
 remains active if a Controller failover occurs.'),
  vlan_pint_tooltip: T('Select the VLAN Parent Interface. Usually an Ethernet\
 card connected to a switch port configured for the VLAN. New link\
 aggregations are not available until the system is restarted.'),
  vlan_tag_tooltip: T('Enter the numeric tag configured in the switched network.'),
  vlan_pcp_tooltip: T('Select the Class of Service. The available 802.1p\
 Class of Service ranges from <i>Best effort (default)</i> \
 to <i>Network control (highest)</i>.'),
  lagg_protocol_tooltip: T('Determines the outgoing and incoming traffic ports.<br> \
 <i>LACP</i> is the recommended protocol if the network switch is capable of \
 active LACP.<br><i>Failover</i> is the default protocol choice and \
 should only be used if the network switch does not support active LACP.'),
  lagg_interfaces_tooltip: T('Select the interfaces to use in the aggregation.<br>\
 Warning: Link Aggregation creation fails if any of the selected\
 interfaces have been manually configured.'),
  lagg_interfaces_failover_tooltip: T('Select the interfaces to use in the aggregation.<br>\
  Warning: Link Aggregation creation fails if any of the selected interfaces\
 have been manually configured.<br>The order is important because the FAILOVER\
 lagg protocol will mark the first interface as the "primary" interface.'),
  mtu_tooltip: T('Maximum Transmission Unit, the largest protocol data \
 unit that can be communicated. The largest workable MTU size varies \
 with network interfaces and equipment. <i>1500</i> and <i>9000</i> \
 are standard Ethernet MTU sizes. Leaving blank restores the field to \
 the default value of <i>1500</i>.'),
};
