import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
// lagg form
lagg_interface_placeholder : T('Lagg Interface'),
lagg_interface_tooltip : T('Description of the lagg interface.'),

lagg_protocol_placeholder : T('Lagg Protocol'),
lagg_protocol_tooltip : T('Select the <a\
 href="--docurl--/network.html#link-aggregations"\
 target="_blank">Protocol Type</a>.<br>\
 <i>LACP</i> is the recommended protocol if the network\
 switch is capable of active LACP.<br>\
 <i>Failover</i> is the default protocol choice and\
 should only be used if the network switch does not\
 support active LACP.'),
lagg_protocol_validation : [ Validators.required ],

lagg_interfaces_placeholder : T('Lagg Interfaces'),
lagg_interfaces_tooltip : T('Select the interfaces to use in the aggregation.<br>\
 Warning: Lagg creation fails if any of the selected\
 interfaces have been manually configured.'),
lagg_interfaces_validation : [ Validators.required ],

// members
id_placeholder : T("Id"),
id_tooltip: T(''),

lagg_interfacegroup_placeholder : T('Lagg Interface Group'),
lagg_interfacegroup_tooltip: T('The member interface to configure.'),
lagg_interfacegroup_validation : [ Validators.required ],

lagg_ordernum_placeholder : T('Lagg Priority Number'),
lagg_ordernum_tooltip: T('Order of selected interface within the lagg. Configure\
 a failover to set the master interface to <i>0</i> and\
 the other interfaces to <i>1</i>, <i>2</i>, etc.'),
lagg_ordernum_validation : [ Validators.required ],

lagg_physnic_placeholder : T('Lagg Physical NIC'),
lagg_physnic_tooltip: T('Physical interface of the selected member.'),
lagg_physnic_validation : [ Validators.required ],

lagg_deviceoptions_placeholder : T('Options'),
lagg_deviceoptions_tooltip: T('Additional parameters from <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ifconfig"\
 target="_blank">ifconfig(8)</a>.'),
lagg_deviceoptions_validation : [ Validators.required ]

}
