import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextLdap = {
  ldap_custactions_clearcache_dialog_message: T('The cache is being rebuilt.'),
  ldap_hostname_tooltip: T('The hostname or IP address of the LDAP server. \
 Separate entries by pressing <code>Enter</code>.'),
  ldap_hostname_noreq_tooltip: T('LDAP server hostnames or IP addresses.\
 Separate entries with an empty space. Multiple hostnames or IP\
 addresses can be entered to create an LDAP failover priority list. If a\
 host does not respond, the next host in the list is tried until a new\
 connection is established.'),
  ldap_basedn_tooltip: T('Top level of the LDAP directory tree to be used when\
 searching for resources. Example: <i>dc=test,dc=org</i>.'),
  ldap_binddn_tooltip: T('Administrative account name on the LDAP server.\
 Example: <i>cn=Manager,dc=test,dc=org</i>.'),
  ldap_bindpw_tooltip: T('Password for the Bind DN.'),
  ldap_anonbind_tooltip: T('Set for the LDAP server to disable authentication and\
 allow read and write access to any client.'),
  ldap_kerberos_realm_tooltip: T('Select an existing realm that was added \
 in <b>Directory Services > Kerberos Realms</b>.'),
  ldap_kerberos_principal_tooltip: T('Select the location of the principal in the \
 keytab created in <b>Directory Services > Kerberos Keytabs</b>.'),
  ldap_ssl_tooltip: T('Options for encrypting the LDAP connection: \
 <ul> \
 <li><i>OFF:</i> do not encrypt the LDAP connection.</li> \
 <li><i>ON:</i> encrypt the LDAP connection with <i>SSL</i> on port \
 <i>636</i>.</li> \
 <li><i>START_TLS:</i> encrypt the LDAP connection with <i>STARTTLS</i> \
 on the default LDAP port <i>389</i>.</li> \
 </ul>'),
  ldap_certificate_tooltip: T('Certificate to use when performing LDAP \
 certificate-based authentication. To configure LDAP certificate-based \
 authentication, create a Certificate Signing Request for the LDAP \
 provider to sign. A certificate is not required when using \
 username/password or Kerberos authentication.'),
  ldap_validate_certificates_tooltip: T('Verify certificate authenticity.'),
  ldap_disable_fn_cache_tooltip: T('Disable caching LDAP users and groups in large LDAP environments. \
 When caching is disabled, LDAP users and groups do not appear in dropdown \
 menus, but are still accepted when manually entered.'),
  ldap_timeout_tooltip: T('LDAP timeout in seconds. Increase this value if a\
 Kerberos ticket timeout occurs.'),
  ldap_dns_timeout_tooltip: T('DNS timeout in seconds. Increase this value if DNS queries timeout.'),
  ldap_idmap_backend_tooltip: T('Backend used to map Windows security \
 identifiers (SIDs) to UNIX UIDs and GIDs. To configure the selected \
 backend, click <i>EDIT IDMAP</i>.'),
  ldap_auxiliary_parameters_tooltip: T('Additional options for <a\
 href="https://arthurdejong.org/nss-pam-ldapd/nslcd.conf.5"\
 target="_blank">nslcd.conf</a>.'),
  ldap_schema_tooltip: T('Select a schema when LDAP NSS schema is set.'),
  ldap_enable_tooltip: T('Activates the configuration. Unset to disable the\
 configuration without deleting it.'),
};
