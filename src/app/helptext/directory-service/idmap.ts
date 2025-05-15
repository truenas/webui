import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { IdmapName } from 'app/enums/idmap.enum';

export const helptextIdmap = {
  idmap: {
    name: {
      tooltip: T('Enter the pre-Windows 2000 domain name.'),
      options: [
        { label: T('Active Directory - Primary Domain'), value: IdmapName.DsTypeActiveDirectory },
        { label: T('SMB - Primary Domain'), value: IdmapName.DsTypeDefaultDomain },
        { label: T('LDAP - Primary Domain'), value: IdmapName.DsTypeLdap },
        { label: T('Custom Value'), value: 'custom' },
      ],
    },
    customNameTooltip: T('Enter the pre-Windows 2000 domain name.'),
    rangeTooltip: T('Range Low and Range High set the range of UID/GID numbers which this \
 IDMap backend translates. If an external credential like a Windows SID maps to a UID or GID \
 number outside this range, the external credential is ignored.'),
    idmapBackendTooltip: T('Provides a plugin interface for Winbind to use varying backends to store \
 SID/uid/gid mapping tables. The correct setting depends on the environment in which the NAS is deployed.'),
    certificateIdTooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. When no certificates are available, move to the Active Directory server and\
 create a Certificate Authority and Certificate. Import the certificate to this system using the\
 System/Certificates menu.'),
    schemaModeTooltip: T('Choose the schema to use with LDAP authentication for\
 SMB shares. The LDAP server must be configured with Samba attributes to use a Samba Schema. \
 Options include <i>RFC2307</i> (included in Windows 2003 R2) and <i>Service for Unix (SFU)</i>. \
 For SFU 3.0 or 3.5, choose "SFU". For SFU 2.0, choose "SFU20".'),
    unixPrimaryGroupTooltip: T('When checked, the primary group membership is fetched from the LDAP \
 attributes (gidNumber). When not checked, the primary group membership is calculated via \
 the "primaryGroupID" LDAP attribute.'),
    unixNssTooltip: T('When checked, winbind will retrieve the login shell and home directory \
 from the LDAP attributes. When not checked or when the AD LDAP entry lacks the SFU attributes \
 the smb4.conf parameters <code>template shell</code> and <code>template homedir</code> are used.'),
    rangesizeTooltip: T('Define the number of UIDS/GIDS available per domain \
 range. The minimum is <i>2000</i> and the recommended default is <i>100000</i>.'),
    readonlyTooltip: T('Set to make the module <i>read-only</i>. No new ranges \
 are allocated or new mappings created in the idmap pool.'),
    ignoreBuiltinTooltip: T('Set to ignore mapping requests for the <i>BUILTIN</i> \
 domain.'),
    ldapBasednTooltip: T('The directory base suffix to use for SID/uid/gid\
 mapping entries. Example: dc=test,dc=org. When undefined, idmap_ldap defaults to using the ldap idmap\
 suffix option from <a href="https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html"\
 target="_blank">smb.conf</a>.'),
    ldapUserdnTooltip: T('User Distinguished Name (DN) to use for authentication.'),
    ldapUrlTooltip: T('LDAP server to use for SID/uid/gid map entries. When\
 undefined, idmap_ldap uses *ldap://localhost/*.\
 Example: <i>ldap://ldap.netscape.com/o=Airius.com</i>.'),
    linkedServiceTooltip: T('Specifies the auxiliary directory service ID provider.'),
    ldapUserDnPasswordTooltip: T('Password associated with the LDAP User DN.'),
    ldapServerTooltip: T('Select the type of LDAP server to use. This can be the\
        LDAP server provided by the Active Directory server or a stand-alone LDAP server.'),
    ldapRealmTooltip: T('Performs authentication from an LDAP server.'),
    bindPathUserTooltip: T('The search base where user objects can be found in the LDAP server.'),
    bindPathGroupTooltip: T('The search base where group objects can be found in the LDAP server.'),
    userCnTooltip: T('Set to query the cn instead of uid attribute for the user name in LDAP.'),
    cnRealmTooltip: T('Append <i>@realm</i> to <i>cn</i> in LDAP queries for\
 both groups and users when User CN is set).'),
    ldapDomainTooltip: T('The domain to access the Active Directory server when\
 using the LDAP server inside the Active Directory server.'),
    sssdCompatTooltip: T('Generate idmap low range based on same algorithm that SSSD uses by default.'),
    enableAdDialog: {
      title: T('Enable Active Directory'),
      message: T('Active Directory must be enabled before adding new domains.'),
      button: T('Go to Active Directory Form'),
    },
    clearCacheDialog: {
      title: T('Clear the Idmap Cache'),
      message: T('The Idmap cache should be cleared after finalizing idmap changes. \
 Click "Continue" to clear the cache.'),
      jobTitle: T('Clearing Cache...'),
      successMessage: T('The cache has been cleared.'),
    },
  },
};
