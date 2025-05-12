import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInterfacesForm = {
  typeTooltip: T('Choose the\
 type of interface. <i>Bridge</i> creates a logical link between\
 multiple networks. <i>Link Aggregation</i> combines multiple network\
 connections into a single interface. A <i>Virtual LAN (VLAN)</i> partitions\
 and isolates a segment of the connection. Read-only when editing an\
 interface.'),
  nameTooltip: T('Enter a name for the interface.\
 Use the format <samp>bond<i>X</i></samp>,\
 <samp>vlan<i>X</i></samp>, or <samp>br<i>X</i></samp> where\
 <i>X</i> is a number representing a non-parent interface. Read-only\
 when editing an interface.'),
  dhcpTooltip: T('Set to enable DHCP. Leave unset to create a static\
 IPv4 or IPv6 configuration. Only one interface can\
 be configured for DHCP.'),
  ipv6autoTooltip: T('Set to automatically configure the IPv6. Only one interface can be configured this way.'),
  enableLearningTooltip: T('Toggle off to defer interface learning until runtime, preventing premature state transitions and potential issues during system startup.'),
  aliasAddressTooltip: T('Define an alias for the interface \
 on this TrueNAS controller. The alias can be an IPv4 or IPv6 \
 address.'),
  bridgeMembersTooltip: T('Network interfaces to include in the bridge.'),
  failover: {
    criticalTooltip: T('Interfaces marked <i>critical</i> are\
 considered necessary for normal operation. When the last critical\
 interface in a failover group is preempted by the other storage\
 controller through the VRRP or CARP protocols, a failover is\
 triggered.'),
    groupTooltip: T('Combine multiple, critical-for-failover \
 interfaces into a group. Groups apply to single systems. A failover \
 occurs when every interface in the group fails. Groups with a single \
 interface trigger a failover when that interface fails. Configuring the \
 system to failover when any interface fails requires marking each \
 interface as critical and placing them in separate groups.'),
    aliasAddressTooltip: T('Alias for the identical interface \
 on the other TrueNAS controller. The alias can be an IPv4 or IPv6 address.'),
    virtualAliasAddressTooltip: T('Define an alias that can \
 connect to the interface on either TrueNAS controller. This address \
 remains active if a Controller failover occurs.'),
  },
  vlan: {
    parentInterfaceTooltip: T('Select the VLAN Parent Interface. Usually an Ethernet\
 card connected to a switch port configured for the VLAN. New link\
 aggregations are not available until the system is restarted.'),
    tagTooltip: T('Enter the numeric tag configured in the switched network.'),
    priorityCodePointTooltip: T('Select the Class of Service. The available 802.1p\
 Class of Service ranges from <i>Best effort (default)</i> \
 to <i>Network control (highest)</i>.'),
  },
  lagg: {
    interfacesTooltip: T('Select the interfaces to use in the aggregation.<br>\
 Warning: Link Aggregation creation fails if any of the selected\
 interfaces have been manually configured.'),
    interfacesFailoverTooltip: T('Select the interfaces to use in the aggregation.<br>\
  Warning: Link Aggregation creation fails if any of the selected interfaces\
 have been manually configured.<br>The order is important because the FAILOVER\
 lagg protocol will mark the first interface as the "primary" interface.'),
  },
  mtuTooltip: T('Maximum Transmission Unit, the largest protocol data \
 unit that can be communicated. The largest workable MTU size varies \
 with network interfaces and equipment. <i>1500</i> and <i>9000</i> \
 are standard Ethernet MTU sizes. Leaving blank restores the field to \
 the default value of <i>1500</i>.'),
};
