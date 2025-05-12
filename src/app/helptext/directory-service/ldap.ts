import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextLdap = {
  cacheBeingRebuilt: T('The cache is being rebuilt.'),
  hostnameTooltip: T('The hostname or IP address of the LDAP server. \
 Separate entries by pressing <code>Enter</code>.'),
  basednTooltip: T('Top level of the LDAP directory tree to be used when\
 searching for resources. Example: <i>dc=test,dc=org</i>.'),
  binddnTooltip: T('Administrative account name on the LDAP server.\
 Example: <i>cn=Manager,dc=test,dc=org</i>.'),
  bindpwTooltip: T('Password for the Bind DN.'),
  anonbindTooltip: T('Set for the LDAP server to disable authentication and\
 allow read and write access to any client.'),
  kerberosRealmTooltip: T('Select an existing realm that was added \
 in <b>Directory Services > Kerberos Realms</b>.'),
  kerberosPrincipalTooltip: T('Select the location of the principal in the \
 keytab created in <b>Directory Services > Kerberos Keytabs</b>.'),
  sslTooltip: T('Options for encrypting the LDAP connection: \
 <ul> \
 <li><i>OFF:</i> do not encrypt the LDAP connection.</li> \
 <li><i>ON:</i> encrypt the LDAP connection with <i>SSL</i> on port \
 <i>636</i>.</li> \
 <li><i>START_TLS:</i> encrypt the LDAP connection with <i>STARTTLS</i> \
 on the default LDAP port <i>389</i>.</li> \
 </ul>'),
  certificateTooltip: T('Certificate to use when performing LDAP \
 certificate-based authentication. To configure LDAP certificate-based \
 authentication, create a Certificate Signing Request for the LDAP \
 provider to sign. A certificate is not required when using \
 username/password or Kerberos authentication.'),
  validateCertificatesTooltip: T('Verify certificate authenticity.'),
  disableCacheTooltip: T('Disable caching LDAP users and groups in large LDAP environments. \
 When caching is disabled, LDAP users and groups do not appear in dropdown \
 menus, but are still accepted when manually entered.'),
  timeoutTooltip: T('LDAP timeout in seconds. Increase this value if a\
 Kerberos ticket timeout occurs.'),
  dnsTimeoutTooltip: T('DNS timeout in seconds. Increase this value if DNS queries timeout.'),
  auxiliaryParametersTooltip: T('Additional options for <a\
 href="https://arthurdejong.org/nss-pam-ldapd/nslcd.conf.5"\
 target="_blank">nslcd.conf</a>.'),
  schemaTooltip: T('Select a schema when LDAP NSS schema is set.'),
};
