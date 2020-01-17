import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {

// For Kerberos Realms form
kerb_form_heading: T('Kerberos Realm'),

krbrealm_form_realm_name: 'realm',
krbrealm_form_realm_placeholder: T('Realm'),
krbrealm_form_realm_tooltip: T('Enter the name of the realm.'),
krbrealm_form_realm_validation : [ Validators.required ],

multiple_values: T('Separate multiple values with a space.'),
krbrealm_form_kdc_name: 'kdc',
krbrealm_form_kdc_placeholder: T('KDC'),
krbrealm_form_kdc_tooltip: T('Enter the name of the Key Distribution Center.'),

krbrealm_form_admin_server_name: 'admin_server',
krbrealm_form_admin_server_placeholder: T('Admin Server'),
krbrealm_form_admin_server_tooltip: T('Define the server where all changes to the database are performed.'),

krbrealm_form_kpasswd_server_name: 'kpasswd_server',
krbrealm_form_kpasswd_server_placeholder: T('Password Server'),
krbrealm_form_kpasswd_server_tooltip: T('Define the server where all password changes are performed.'),

krbrealm_form_advanced_field_array: [
'kdc',
'admin_server',
'kpasswd_server',
],

krbrealm_form_custactions_basic_id: 'basic_mode',
krbrealm_form_custactions_basic_name: 'Basic Mode',

krbrealm_form_custactions_adv_id: 'advanced_mode',
krbrealm_form_custactions_adv_name: 'Advanced Mode',

// For Kerberos Realms list
krb_realmlist_deletemessage_title: 'Kerberos Realm',
krb_realmlist_deletemessage_key_props: ['realm']
}
