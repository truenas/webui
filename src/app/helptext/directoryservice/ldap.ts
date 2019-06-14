import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
ldap_custactions_basic_id : 'basic_mode',
ldap_custactions_basic_name : T('Basic Mode'),

ldap_custactions_advanced_id : 'advanced_mode',
ldap_custactions_advanced_name : T('Advanced Mode'),

ldap_custactions_edit_imap_id : 'edit_idmap',
ldap_custactions_edit_imap_name : T('Edit Idmap'),

ldap_custactions_clearcache_id : 'ds_clearcache',
ldap_custactions_clearcache_name : T('Rebuild Directory Service Cache'),
ldap_custactions_clearcache_dialog_title : T("LDAP"),
ldap_custactions_clearcache_dialog_message : T("The cache is being rebuilt."),

ldap_hostname_name : 'ldap_hostname',
ldap_hostname_placeholder : T('Hostname'),
ldap_hostname_tooltip: T('The hostname or IP address of the LDAP server.'),
ldap_hostname_validation: [Validators.required],

ldap_hostname_noreq_name : 'ldap_hostname_noreq',
ldap_hostname_noreq_placeholder : T('Hostname'),
ldap_hostname_noreq_tooltip: T('The hostname or IP address of the LDAP server.'),

ldap_basedn_name : 'ldap_basedn',
ldap_basedn_placeholder : T('Base DN'),
ldap_basedn_tooltip: T('Top level of the LDAP directory tree to be used when\
 searching for resources. Example: <i>dc=test,dc=org</i>.'),

ldap_binddn_name : 'ldap_binddn',
ldap_binddn_placeholder : T('Bind DN'),
ldap_binddn_tooltip: T('Administrative account name on the LDAP server.\
 Example: <i>cn=Manager,dc=test,dc=org</i>.'),

ldap_bindpw_name : 'ldap_bindpw',
ldap_bindpw_placeholder : T('Bind Password'),
ldap_bindpw_tooltip: T('Password for the Bind DN.'),

ldap_anonbind_name : 'ldap_anonbind',
ldap_anonbind_placeholder: T('Allow Anonymous Binding'),
ldap_anonbind_tooltip : T('Set for the LDAP server to disable authentication and\
 allow read and write access to any client.'),

ldap_usersuffix_name : 'ldap_usersuffix',
ldap_usersuffix_placeholder : T('User Suffix'),
ldap_usersuffix_tooltip: T('Suffix to add to a name when the user account is added\
 to the LDAP directory.'),

ldap_groupsuffix_name : 'ldap_groupsuffix',
ldap_groupsuffix_placeholder : T('Group Suffix'),
ldap_groupsuffix_tooltip: T('Suffix to add to a name when the group is added to the\
 LDAP directory.'),

ldap_passwordsuffix_name : 'ldap_passwordsuffix',
ldap_passwordsuffix_placeholder : T('Password Suffix'),
ldap_passwordsuffix_tooltip: T('Suffix to add to the password when it is added to the\
 LDAP directory.'),

ldap_machinesuffix_name : 'ldap_machinesuffix',
ldap_machinesuffix_placeholder : T('Machine Suffix'),
ldap_machinesuffix_tooltip: T('Suffix to add to the system name when it is added to\
 the LDAP directory.'),

ldap_sudosuffix_name : 'ldap_sudosuffix',
ldap_sudosuffix_placeholder : T('SUDO Suffix'),
ldap_sudosuffix_tooltip: T('Suffix for LDAP-based users that need superuser access.'),

ldap_kerberos_realm_name : 'ldap_kerberos_realm',
ldap_kerberos_realm_placeholder : T('Kerberos Realm'),
ldap_kerberos_realm_tooltip: T('Select the realm created using the instructions in <a\
 href="%%docurl%%/directoryservices.html#kerberos-realms"\
 target="_blank">Kerberos Realms</a>.'),

ldap_kerberos_principal_name : 'ldap_kerberos_principal',
ldap_kerberos_principal_placeholder : T('Kerberos Principal'),
ldap_kerberos_principal_tooltip: T('Select the location of the principal in the keytab\
 created as described in <a\
 href="%%docurl%%/directoryservices.html#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a>.'),

ldap_ssl_name : 'ldap_ssl',
ldap_ssl_placeholder : T('Encryption Mode'),
ldap_ssl_tooltip: T('Authentication only functions when a Certificate\
 is selected with either the <i>SSL</i> or <i>TLS</i> option.'),

ldap_certificate_name : 'ldap_certificate',
ldap_certificate_placeholder : T('Certificate'),
ldap_certificate_tooltip: T('Select the LDAP CA certificate. The certificate for the\
 LDAP server CA must first be imported using the System/Certificates menu.'),

ldap_disable_fn_cache_name : 'ldap_disable_freenas_cache',
ldap_disable_fn_cache_placeholder : T('Disable LDAP user/group cache'),
ldap_disable_fn_cache_tooltip: T('Set to disable caching LDAP users and groups in large LDAP environments. \
 When caching is disabled, LDAP users and groups do not appear in dropdown \
 menus, but are still accepted when manually entered.'),

ldap_timeout_name : 'ldap_timeout',
ldap_timeout_placeholder : T('LDAP timeout'),
ldap_timeout_tooltip: T('LDAP timeout in seconds. Increase this value if a\
 Kerberos ticket timeout occurs.'),

ldap_dns_timeout_name : 'ldap_dns_timeout',
ldap_dns_timeout_placeholder : T('DNS timeout'),
ldap_dns_timeout_tooltip: T('DNS timeout in seconds. Increase this value if DNS queries timeout.'),

ldap_idmap_backend_name : 'ldap_idmap_backend',
ldap_idmap_backend_placeholder : T('Idmap Backend'),
ldap_idmap_backend_tooltip: T('Backend used to map Windows security identifiers\
 (SIDs) to UNIX UIDs and GIDs. Click Edit to configure that backend'),

ldap_has_samba_schema_name : 'ldap_has_samba_schema',
ldap_has_samba_schema_placeholder : T('Samba Schema'),
ldap_has_samba_schema_tooltip: T('Only set LDAP authentication for\
 SMB shares is required and the LDAP server is already configured with Samba attributes.'),

ldap_auxiliary_parameters_name : 'ldap_auxiliary_parameters',
ldap_auxiliary_parameters_placeholder : T('Auxiliary Parameters'),
ldap_auxiliary_parameters_tooltip: T('Additional options for <a\
 href="https://jhrozek.fedorapeople.org/sssd/1.11.6/man/sssd.conf.5.html"\
 target="_blank">sssd.conf(5)</a>.'),

ldap_schema_name : 'ldap_schema',
ldap_schema_placeholder : T('Schema'),
ldap_schema_tooltip: T('Select a schema when Samba Schema is set.'),

ldap_enable_name : 'ldap_enable',
ldap_enable_placeholder : T('Enable'),
ldap_enable_tooltip: T('Activates the configuration. Unset to disable the\
 configuration without deleting it.'),

ldap_netbiosname_a_name : 'ldap_netbiosname_a',
ldap_netbiosname_a_placeholder : T('Netbios Name'),
ldap_netbiosname_a_tooltip: T('Netbios Name of this NAS. This name must differ from\
 the <i>Workgroup</i> name and be no greater than 15 characters.'),

ldap_netbiosalias_name : 'ldap_netbiosalias',
ldap_netbiosalias_placeholder : T('NetBIOS alias'),
ldap_netbiosalias_tooltip: T('Alternative names that SMB clients can use when\
 connecting to this NAS. Can be no greater than 15 characters.'),

ldap_advanced_fields : 
[
'ldap_anonbind',
'ldap_disable_freenas_cache',
'ldap_usersuffix',
'ldap_groupsuffix',
'ldap_passwordsuffix',
'ldap_machinesuffix',
'ldap_sudosuffix',
'ldap_kerberos_realm',
'ldap_kerberos_principal',
'ldap_ssl',
'ldap_certificate',
'ldap_timeout',
'ldap_dns_timeout',
'ldap_idmap_backend',
'ldap_has_samba_schema',
'ldap_auxiliary_parameters',
'ldap_schema',
'ldap_netbiosalias',
'ldap_netbiosname_a'
]
}
