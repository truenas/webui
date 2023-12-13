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
    custom_name: {
      tooltip: T('Enter the pre-Windows 2000 domain name.'),
    },
    dns_domain_name: {
      tooltip: T('DNS name of the domain'),
    },
    range_tooltip: T('Range Low and Range High set the range of UID/GID numbers which this \
 IDMap backend translates. If an external credential like a Windows SID maps to a UID or GID \
 number outside this range, the external credential is ignored.'),
    idmap_backend: {
      tooltip: T('Provides a plugin interface for Winbind to use varying backends to store \
 SID/uid/gid mapping tables. The correct setting depends on the environment in which the NAS is deployed.'),
    },
    certificate_id: {
      tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. When no certificates are available, move to the Active Directory server and\
 create a Certificate Authority and Certificate. Import the certificate to this system using the\
 System/Certificates menu.'),
    },
    schema_mode: {
      tooltip: T('Choose the schema to use with LDAP authentication for\
 SMB shares. The LDAP server must be configured with Samba attributes to use a Samba Schema. \
 Options include <i>RFC2307</i> (included in Windows 2003 R2) and <i>Service for Unix (SFU)</i>. \
 For SFU 3.0 or 3.5, choose "SFU". For SFU 2.0, choose "SFU20".'),
    },
    unix_primary_group: {
      tooltip: T('When checked, the primary group membership is fetched from the LDAP \
 attributes (gidNumber). When not checked, the primary group membership is calculated via \
 the "primaryGroupID" LDAP attribute.'),
    },
    unix_nss: {
      tooltip: T('When checked, winbind will retrieve the login shell and home directory \
 from the LDAP attributes. When not checked or when the AD LDAP entry lacks the SFU attributes \
 the smb4.conf parameters <code>template shell</code> and <code>template homedir</code> are used.'),
    },
    rangesize: {
      tooltip: T('Define the number of UIDS/GIDS available per domain \
 range. The minimum is <i>2000</i> and the recommended default is <i>100000</i>.'),
    },
    readonly: {
      tooltip: T('Set to make the module <i>read-only</i>. No new ranges \
 are allocated or new mappings created in the idmap pool.'),
    },
    ignore_builtin: {
      tooltip: T('Set to ignore mapping requests for the <i>BUILTIN</i> \
 domain.'),
    },
    ldap_basedn: {
      tooltip: T('The directory base suffix to use for SID/uid/gid\
 mapping entries. Example: dc=test,dc=org. When undefined, idmap_ldap defaults to using the ldap idmap\
 suffix option from <a href="https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html"\
 target="_blank">smb.conf</a>.'),
    },
    ldap_userdn: {
      tooltip: T('User Distinguished Name (DN) to use for authentication.'),
    },
    ldap_url: {
      tooltip: T('LDAP server to use for SID/uid/gid map entries. When\
 undefined, idmap_ldap uses *ldap://localhost/*.\
 Example: <i>ldap://ldap.netscape.com/o=Airius.com</i>.'),
    },
    ssl: {
      tooltip: T('Choose an encryption mode to use with LDAP.'),
    },
    linked_service: {
      tooltip: T('Specifies the auxiliary directory service ID provider.'),
    },
    ldap_user_dn_password: {
      tooltip: T('Password associated with the LDAP User DN.'),
    },
    ldap_server: {
      tooltip: T('Select the type of LDAP server to use. This can be the\
        LDAP server provided by the Active Directory server or a stand-alone LDAP server.'),
    },
    ldap_realm: {
      tooltip: T('Performs authentication from an LDAP server.'),
    },
    bind_path_user: {
      tooltip: T('The search base where user objects can be found in the LDAP server.'),
    },
    bind_path_group: {
      tooltip: T('The search base where group objects can be found in the LDAP server.'),
    },
    user_cn: {
      tooltip: T('Set to query the cn instead of uid attribute for the user name in LDAP.'),
    },
    cn_realm: {
      tooltip: T('Append <i>@realm</i> to <i>cn</i> in LDAP queries for\
 both groups and users when User CN is set).'),
    },
    ldap_domain: {
      tooltip: T('The domain to access the Active Directory server when\
 using the LDAP server inside the Active Directory server.'),
    },
    sssd_compat: {
      tooltip: T('Generate idmap low range based on same algorithm that SSSD uses by default.'),
    },
    enable_ad_dialog: {
      title: T('Enable Active Directory'),
      message: T('Active Directory must be enabled before adding new domains.'),
      button: T('Go to Active Directory Form'),
    },
    clear_cache_dialog: {
      title: T('Clear the Idmap Cache'),
      message: T('The Idmap cache should be cleared after finalizing idmap changes. \
 Click "Continue" to clear the cache.'),
      job_title: T('Clearing Cache...'),
      success_title: T('Success'),
      success_msg: T('The cache has been cleared.'),
    },
  },
};
