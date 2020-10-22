import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
title_add: T('Add Static Route'),
title_edit: T('Edit Static Route'),

sr_fieldset_general: T('General Options'),

sr_destination_placeholder : T('Destination'),
sr_destination_tooltip : T('Use the format <i>A.B.C.D/E</i> where <i>E</i> is the CIDR mask.'),
sr_destination_validation : [ Validators.required ],

sr_gateway_placeholder : T('Gateway'),
sr_gateway_tooltip : T('Enter the IP address of the gateway.'),
sr_gateway_validation : [ Validators.required ],

sr_description_placeholder : T('Description'),
sr_description_tooltip : T('Enter a description of the static route.'),
}