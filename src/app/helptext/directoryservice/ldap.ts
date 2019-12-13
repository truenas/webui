import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
ldap_server_creds: T('Server Credentials'),
ldap_advanced: T('Advanced Settings'),

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

ldap_hostname_name : 'hostname',
ldap_hostname_placeholder : T('Hostname'),
ldap_hostname_tooltip: T('The hostname or IP address of the LDAP server.'),
ldap_hostname_validation: [Validators.required],

ldap_hostname_noreq_name : 'hostname_noreq',
ldap_hostname_noreq_placeholder : T('Hostname'),
ldap_hostname_noreq_tooltip: T('LDAP server hostnames or IP addresses.\
 Separate entries with an empty space. Multiple hostnames or IP\
 addresses can be entered to create an LDAP failover priority list. If a\
 host does not respond, the next host in the list is tried until a new\
 connection is established.'),

ldap_basedn_name : 'basedn',
ldap_basedn_placeholder : T('Base DN'),
ldap_basedn_tooltip: T('Top level of the LDAP directory tree to be used when\
 searching for resources. Example: <i>dc=test,dc=org</i>.'),

ldap_binddn_name : 'binddn',
ldap_binddn_placeholder : T('Bind DN'),
ldap_binddn_tooltip: T('Administrative account name on the LDAP server.\
 Example: <i>cn=Manager,dc=test,dc=org</i>.'),

ldap_bindpw_name : 'bindpw',
ldap_bindpw_placeholder : T('Bind Password'),
ldap_bindpw_tooltip: T('Password for the Bind DN.'),

ldap_anonbind_name : 'anonbind',
ldap_anonbind_placeholder: T('Allow Anonymous Binding'),
ldap_anonbind_tooltip : T('Set for the LDAP server to disable authentication and\
 allow read and write access to any client.'),

ldap_kerberos_realm_name : 'kerberos_realm',
ldap_kerberos_realm_placeholder : T('Kerberos Realm'),
ldap_kerberos_realm_tooltip: T('Select the realm created using the instructions in <a\
 href="--docurl--/directoryservices.html#kerberos-realms"\
 target="_blank">Kerberos Realms</a>.'),

ldap_kerberos_principal_name : 'kerberos_principal',
ldap_kerberos_principal_placeholder : T('Kerberos Principal'),
ldap_kerberos_principal_tooltip: T('Select the location of the principal in the keytab\
 created as described in <a\
 href="--docurl--/directoryservices.html#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a>.'),

ldap_ssl_name : 'ssl',
ldap_ssl_placeholder : T('Encryption Mode'),
ldap_ssl_tooltip: T('Options for encrypting the LDAP connection: \
 <ul> \
 <li><i>OFF:</i> Do not encrypt the LDAP connection.</li> \
 <li><i>ON:</i> <i>SSL</i> encrypts the LDAP connection and uses port \
 <i>636</i>.</li> \
 <li><i>START_TLS:</i> <i>STARTTLS</i> encrypts the LDAP connection and \
 uses the default LDAP port <i>389</i>.</li> \
 </ul>'),

ldap_certificate_name : 'certificate',
ldap_certificate_placeholder : T('Certificate'),
ldap_certificate_tooltip: T('Certificate to use when performing LDAP \
 certificate-based authentication. To configure LDAP certificate-based \
 authentication, create a Certificate Signing Request for the LDAP \
 provider to sign. A certificate is not required when using \
 username/password or Kerberos authentication.'),

ldap_validate_certificates_placeholder: T('Validate Certificates'),
ldap_validate_certificates_tooltip: T('Verify certificate authenticity.'),

ldap_disable_fn_cache_name : 'disable_freenas_cache',
ldap_disable_fn_cache_placeholder : T('Disable LDAP User/Group Cache'),
ldap_disable_fn_cache_tooltip: T('Disable caching LDAP users and groups in large LDAP environments. \
 When caching is disabled, LDAP users and groups do not appear in dropdown \
 menus, but are still accepted when manually entered.'),

ldap_timeout_name : 'timeout',
ldap_timeout_placeholder : T('LDAP timeout'),
ldap_timeout_tooltip: T('LDAP timeout in seconds. Increase this value if a\
 Kerberos ticket timeout occurs.'),

ldap_dns_timeout_name : 'dns_timeout',
ldap_dns_timeout_placeholder : T('DNS timeout'),
ldap_dns_timeout_tooltip: T('DNS timeout in seconds. Increase this value if DNS queries timeout.'),

ldap_idmap_backend_name : 'idmap_backend',
ldap_idmap_backend_placeholder : T('Idmap Backend'),
ldap_idmap_backend_tooltip: T('Backend used to map Windows security \
 identifiers (SIDs) to UNIX UIDs and GIDs. To configure the selected \
 backend, click <i>EDIT IDMAP</i>.'),

ldap_has_samba_schema_name : 'has_samba_schema',
ldap_has_samba_schema_placeholder : T('Samba Schema'),
ldap_has_samba_schema_tooltip: T('Only set LDAP authentication for\
 SMB shares is required and the LDAP server is already configured with Samba attributes.'),

ldap_auxiliary_parameters_name : 'auxiliary_parameters',
ldap_auxiliary_parameters_placeholder : T('Auxiliary Parameters'),
ldap_auxiliary_parameters_tooltip: T('Additional options for <a\
 href="https://jhrozek.fedorapeople.org/sssd/1.11.6/man/sssd.conf.5.html"\
 target="_blank">sssd.conf(5)</a>.'),

ldap_schema_name : 'schema',
ldap_schema_placeholder : T('Schema'),
ldap_schema_tooltip: T('Select a schema when Samba Schema is set.'),

ldap_enable_name : 'enable',
ldap_enable_placeholder : T('Enable'),
ldap_enable_tooltip: T('Activates the configuration. Unset to disable the\
 configuration without deleting it.'),

ldap_advanced_fields : 
[
'anonbind',
'disable_freenas_cache',
'usersuffix',
'groupsuffix',
'passwordsuffix',
'machinesuffix',
'sudosuffix',
'kerberos_realm',
'kerberos_principal',
'ssl',
'certificate',
'validate_certificates',
'timeout',
'dns_timeout',
'idmap_backend',
'has_samba_schema',
'auxiliary_parameters',
'schema'
]
}
