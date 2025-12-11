import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { IdmapName } from 'app/enums/idmap.enum';

export const helptextIdmap = {
  idmap: {
    useDefaultIdmapTooltip: T('Use TrueNAS default IDMAP configuration. Defaults are suitable for new deployments without \
existing support for unix-like operating systems. The default configuration uses the RID backend with predefined \
UID/GID ranges (builtin: 90000001-100000000, domain: 100000001-200000000).'),
    name: {
      tooltip: T('Short name for the domain. This should match the NetBIOS domain name for Active Directory domains. \
It may be null if the domain is configured as the base IDMAP for Active Directory.'),
      options: [
        { label: T('Active Directory - Primary Domain'), value: IdmapName.DsTypeActiveDirectory },
        { label: T('SMB - Primary Domain'), value: IdmapName.DsTypeDefaultDomain },
        { label: T('LDAP - Primary Domain'), value: IdmapName.DsTypeLdap },
        { label: T('Custom Value'), value: 'custom' },
      ],
    },
    rangeTooltip: T('The lowest and highest UID or GID that the IDMAP backend can assign.'),
    rangeLowTooltip: T('The lowest UID or GID that the IDMAP backend can assign.'),
    rangeHighTooltip: T('The highest UID or GID that the IDMAP backend can assign.'),
    idmapBackendTooltip: T('This configuration defines how domain accounts joined to TrueNAS are mapped to Unix UIDs and GIDs on the \
TrueNAS server. Most TrueNAS deployments use the RID backend, which algorithmically assigns UIDs and GIDs based on \
the Active Directory account SID. Another common option is the AD backend, which reads predefined Active Directory \
LDAP schema attributes that assign explicit UID and GID numbers to accounts.'),
    schemaModeTooltip: T('The schema mode the IDMAP backend uses to query Active Directory for user and group information. The RFC2307 \
schema applies to Windows Server 2003 R2 and newer. The Services for Unix (SFU) schema applies to versions before \
Windows Server 2003 R2.'),
    unixPrimaryGroupTooltip: T('Defines if the user\'s primary group is fetched from SFU attributes or the Active Directory primary group. \
If True, the TrueNAS server uses the gidNumber LDAP attribute. If False, it uses the primaryGroupID LDAP attribute.'),
    unixNssTooltip: T('If True, the login shell and home directory are retrieved from LDAP attributes. If False, or if the Active \
Directory LDAP entry lacks SFU attributes, the home directory defaults to /var/empty.'),
    readonlyTooltip: T('If readonly is set to True then TrueNAS will not attempt to write new IDMAP entries.'),
    ldapBasednTooltip: T('Directory base suffix to use for mapping UIDs and GIDs to SIDs.'),
    ldapUserdnTooltip: T('Defines the user DN to be used for authentication to the LDAP server.'),
    ldapUrlTooltip: T('LDAP server to use for the IDMAP entries.'),
    ldapUserDnPasswordTooltip: T('Secret to use for authenticating the user specified by ldap_user_dn.'),
    ldapRealmTooltip: T('Append @realm to the CN for groups. Also append it to users if user_cn is specified.'),
    bindPathUserTooltip: T('The search base that contains user objects in the LDAP server.'),
    bindPathGroupTooltip: T('The search base that contains group objects in the LDAP server.'),
    userCnTooltip: T('If set, query the CN attribute instead of the UID attribute for the user name in LDAP.'),
    sssdCompatTooltip: T('Generate an IDMAP low range using the algorithm from SSSD. This works if the domain uses only a single SSSD \
idmap slice, and is sufficient if the domain uses only a single SSSD IDMAP slice.'),
  },
};
