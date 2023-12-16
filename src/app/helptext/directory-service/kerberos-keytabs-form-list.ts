import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextKerberosKeytabs = {
  // Kerberos Keytabs form
  title_add: T('Add Kerberos Keytab'),
  title_edit: T('Edit Kerberos Keytab'),
  kkt_ktname_placeholder: T('Name'),
  kkt_ktname_tooltip: T('Enter a name for this Keytab.'),
  kkt_ktname_validation: [Validators.required],

  kkt_ktfile_placeholder: T('Kerberos Keytab'),
  kkt_ktfile_tooltip: T('Browse to the keytab file to upload.'),

  // Kerberos Keytabs list
  kkt_list_delmsg_title: T('Kerberos Keytab'),
  kkt_list_delmsgkey_props: ['name'],

};
