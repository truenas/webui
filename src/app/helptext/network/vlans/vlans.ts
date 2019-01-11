import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
vlan_vint_placeholder : T('Virtual Interface'),
vlan_vint_tooltip: T('Enter the name of the Virtual Interface. Use the\
 format <i>vlanX</i> where <i>X</i> is a number\
 representing a non-parent VLAN interface.'),
vlan_vint_validation: [ Validators.required ],

vlan_pint_placeholder: T('Parent Interface'),
vlan_pint_tooltip: T('Select the VLAN Parent Interface. Usually an Ethernet\
 card connected to a configured switch port. Newly\
 created link aggregations will not be available until\
 the system is rebooted.'),
vlan_pint_validation: [ Validators.required ],


vlan_tag_placeholder: T('Vlan Tag'),
vlan_tag_tooltip: T('Enter the numeric tag configured in the switched network.'),
vlan_tag_validation: [Validators.min(1), Validators.max(4095), Validators.required, regexValidator(/^\d+$/)],

vlan_description_placeholder: T('Description'),
vlan_description_tooltip: T('Description of the VLAN.'),

vlan_pcp_placeholder: T('Priority Code Point'),
vlan_pcp_tooltip: T('Select the Class of Service. The available 802.1p\
 Class of Service ranges from <i>Best effort (default)</i> \
 to <i>Network control (highest)</i>.')
}