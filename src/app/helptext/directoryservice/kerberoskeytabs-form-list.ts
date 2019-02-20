import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
// Kerberos Keytabs form
kkt_ktname_name: 'keytab_name',
kkt_ktname_placeholder: T('Name'),
kkt_ktname_tooltip: T('Enter a name for this Keytab.'),
kkt_ktname_validation : [ Validators.required ],

kkt_ktfile_name: 'keytab_file',
kkt_ktfile_placeholder: T('Kerberos Keytab'),
kkt_ktfile_tooltip: T('Browse to the keytab file to upload.'),
kkt_ktfile_validation : [ Validators.required ],

// Kerberos Keytabs list
kkt_list_delmsg_title: T('Kerberos Keytab'),
kkt_list_delmsgkey_props: ['keytab_name'],

kkt_list_actions_delete_id: "delete",
kkt_list_actions_delete_label: T("Delete")
}