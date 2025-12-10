import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextLdap = {
  hostnameTooltip: T('The hostname or IP address of the LDAP server. \
 Separate entries by pressing <code>Enter</code>.'),
  basednTooltip: T('Top level of the LDAP directory tree to be used when\
 searching for resources. Example: <i>dc=test,dc=org</i>.'),
  sslTooltip: T('Options for encrypting the LDAP connection: \
 <ul> \
 <li><i>OFF:</i> do not encrypt the LDAP connection.</li> \
 <li><i>ON:</i> encrypt the LDAP connection with <i>SSL</i> on port \
 <i>636</i>.</li> \
 <li><i>START_TLS:</i> encrypt the LDAP connection with <i>STARTTLS</i> \
 on the default LDAP port <i>389</i>.</li> \
 </ul>'),
  validateCertificatesTooltip: T('Verify certificate authenticity.'),
  auxiliaryParametersTooltip: T('Additional options for <a\
 href="https://arthurdejong.org/nss-pam-ldapd/nslcd.conf.5"\
 target="_blank">nslcd.conf</a>.'),
  schemaTooltip: T('Select a schema when LDAP NSS schema is set.'),
  shadowLastChangeTooltip: T('LDAP attribute for password last change.'),
  shadowMinTooltip: T('LDAP attribute for minimum password age.'),
  shadowMaxTooltip: T('LDAP attribute for maximum password age.'),
  shadowWarningTooltip: T('LDAP attribute for password warning period.'),
  shadowInactiveTooltip: T('LDAP attribute for account inactive period.'),
  shadowExpireTooltip: T('LDAP attribute for account expiration.'),
  groupObjectClassTooltip: T('LDAP object class for groups.'),
  groupGidTooltip: T('LDAP attribute for group ID.'),
  groupMemberTooltip: T('LDAP attribute for group members.'),
  netgroupObjectClassTooltip: T('LDAP object class for netgroups.'),
  netgroupMemberTooltip: T('LDAP attribute for netgroup members.'),
  netgroupTripleTooltip: T('LDAP attribute for netgroup triples.'),
  useStandardAuxiliaryParametersTooltip: T('Use TrueNAS standard auxiliary parameters for LDAP configuration. Disable this to provide \
custom nslcd.conf auxiliary parameters.'),
  useStandardSearchBasesTooltip: T('Use the base DN for user, group, and netgroup searches. Disable this to specify alternative LDAP \
search base settings. These settings define where to find user, group, and netgroup entries. Use custom search bases only if the \
LDAP server uses a non-standard LDAP schema or if you want to limit the accounts available on TrueNAS.'),
  baseUserTooltip: T('Optional base DN to limit LDAP user searches. If null (default) then the base_dn is used.'),
  baseGroupTooltip: T('Optional base DN to limit LDAP group searches. If null (default) then the base_dn is used.'),
  baseNetgroupTooltip: T('Optional base DN to limit LDAP netgroup searches. If null (default) then the base_dn is used.'),
  useStandardAttributeMapsTooltip: T('Use standard RFC2307 or RFC2307BIS attribute mappings. Disable this to provide custom LDAP \
attribute mapping for LDAP servers that do not follow RFC2307 or RFC2307BIS. Use custom attribute maps only if the LDAP server is \
non-standard.'),
  userObjectClassTooltip: T('The user entry object class in LDAP.'),
  userNameTooltip: T('The LDAP attribute for the user\'s login name.'),
  userUidTooltip: T('The LDAP attribute for the user\'s id.'),
  userGidTooltip: T('The LDAP attribute for the user\'s primary group id.'),
  userGecosTooltip: T('The LDAP attribute for the user\'s gecos field.'),
  userHomeDirectoryTooltip: T('The LDAP attribute for the user\'s home directory.'),
  userShellTooltip: T('The LDAP attribute for the path to the user\'s default shell.'),
};
