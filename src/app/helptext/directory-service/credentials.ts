import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCredentials = {
  credentialTypeTooltip: T('Credential used to bind to the specified directory service. Kerberos credentials are required for Active \
Directory or IPA domains. Generic LDAP environments support various authentication methods. Available methods \
depend on the remote LDAP server configuration. If Kerberos credentials are selected for LDAP, GSSAPI binds \
replace plain LDAP binds. Use Kerberos or mutual TLS authentication when possible for better security.'),
  usernameTooltip: T('Username of the account to use to create a kerberos ticket for authentication to directory services. This \
account must exist on the domain controller.'),
  passwordTooltip: T('The password for the user account that will obtain the kerberos ticket.'),
  principalTooltip: T('A kerberos principal is a unique identity to which Kerberos can assign tickets. The specified kerberos \
principal must have an entry within a keytab on the TrueNAS server.'),
  binddnTooltip: T('Distinguished name to use for LDAP authentication.'),
  bindpwTooltip: T('Password for the bind DN used for LDAP authentication.'),
  clientCertificateTooltip: T('The client certificate name used for mutual TLS authentication to the remote LDAP server.'),
};
