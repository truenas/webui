import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
idmap_range_low_placeholder: T('Range Low'),
idmap_range_high_placeholder: T('Range High'),
idmap_range_tooltip: T('Range Low and Range High set the range of UID/GID numbers which this \
 IDMap backend translates. If an external credential like a Windows SID maps to a UID or GID \
 number outside this range, the external credential is ignored.'),

idmap_ad_schema_mode_name : 'schema_mode',
idmap_ad_schema_mode_placeholder : T('Schema mode'),
idmap_ad_schema_mode_tooltip : T('Choose the schema to use with LDAP authentication for\
 SMB shares. The LDAP server must be configured with Samba attributes to use a Samba Schema.'),
idmap_ad_schema_mode_options:
[{
label: 'rfc2307',
value: 'RFC2307',
}, {
label: 'sfu',
value: 'SFU',
}, {
label: 'sfu20',
value: 'SFU20',
}],

idmap_autorid_rangesize_name : 'rangesize',
idmap_autorid_rangesize_placeholder : T('Range Size'),
idmap_autorid_rangesize_tooltip : T('Define the number of UIDS/GIDS available per domain\
 range. The minimum is <i>2000</i> and the recommended default is <i>100000</i>.'),

idmap_autorid_readonly_name : 'readonly',
idmap_autorid_readonly_placeholder : T('Read Only'),
idmap_autorid_readonly_tooltip : T('Set to make the module <i>read-only</i>. No new ranges\
 are allocated or new mappings created in the idmap pool.'),

idmap_autorid_ignore_builtin_name : 'ignore_builtin',
idmap_autorid_ignore_builtin_placeholder : T('Ignore Builtin'),
idmap_autorid_ignore_builtin_tooltip : T('Set to ignore mapping requests for the <i>BUILTIN</i>\
 domain.'),

idmap_ldap_basedn_name: 'ldap_base_dn',
idmap_ldap_basedn_placeholder: T('Base DN'),
idmap_ldap_basedn_tooltip: T('The directory base suffix to use for SID/uid/gid\
 mapping entries. Example: dc=test,dc=org. When undefined, idmap_ldap defaults to using the ldap idmap\
 suffix option from <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf"\
 target="_blank">smb.conf</a>.'),

idmap_ldap_userdn_name : 'ldap_user_dn',
idmap_ldap_userdn_placeholder: T('User DN'),
idmap_ldap_userdn_tooltip: T('User Distinguished Name (DN) to use for authentication.'),

idmap_ldap_url_name : 'ldap_url',
idmap_ldap_url_placeholder: T('URL'),
idmap_ldap_url_tooltip: T('LDAP server to use for SID/uid/gid map entries. When\
 undefined, idmap_ldap uses *ldap://localhost/*.\
 Example: <i>ldap://ldap.netscape.com/o=Airius.com</i>.'),

idmap_ldap_ssl_name : 'ssl',
idmap_ldap_ssl_placeholder: T('Encryption Mode'),
idmap_ldap_ssl_tooltip: T('Choose an encryption mode to use with LDAP.'),
idmap_ldap_ssl_options: 
[{
label: 'Off',
value: 'OFF',
}, {
label: 'SSL',
value: 'ON',
}, {
label: 'STARTTLS',
value: 'START_TLS',
}],

idmap_ldap_cert_name : '',
idmap_ldap_cert_placeholder: T('Certificate'),
idmap_ldap_cert_tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. When no certificates are available, move to the Active Directory server and\
 create a Certificate Authority and Certificate. Import the certificate to this system using the\
 System/Certificates menu.'),

idmap_rfc2307_ldap_server_name : 'ldap_server',
idmap_rfc2307_ldap_server_placeholder: T('LDAP Server'),
idmap_rfc2307_ldap_server_tooltip: T('Select the type of LDAP server to use. This can be the\
 LDAP server provided by the Active Directory server or a stand-alone LDAP server.'),

idmap_rfc2307_bpuser_name : 'bind_path_user',
idmap_rfc2307_bpuser_placeholder: T('User Bind Path'),
idmap_rfc2307_bpuser_tooltip: T('The search base where user objects can be found in the\
 LDAP server.'),

idmap_rfc2307_bpgroup_name : 'bind_path_group',
idmap_rfc2307_bpgroup_placeholder: T('Group Bind Path'),
idmap_rfc2307_bpgroup_tooltip: T('The search base where group objects can be found in\
 the LDAP server.'),

idmap_rfc2307_user_cn_name : 'user_cn',
idmap_rfc2307_user_cn_placeholder: T('User CN'),
idmap_rfc2307_user_cn_tooltip: T('Set to query the cn instead of uid attribute for the user name in LDAP.'),

idmap_rfc2307_cn_realm_name : 'cn_realm',
idmap_rfc2307_cn_realm_placeholder: T('CN Realm'),
idmap_rfc2307_cn_realm_tooltip: T('Append <i>@realm</i> to <i>cn</i> in LDAP queries for\
 both groups and users when User CN is set).'),

idmap_rfc2307_ldap_domain_name : 'ldap_domain',
idmap_rfc2307_ldap_domain_placeholder: T('LDAP Domain'),
idmap_rfc2307_ldap_domain_tooltip: T('The domain to access the Active Directory server when\
 using the LDAP server inside the Active Directory server.'),

idmap_rfc2307_ldap_url_name : 'ldap_url',
idmap_rfc2307_ldap_url_placeholder: T('LDAP URL'),
idmap_rfc2307_ldap_url_tooltip: T('The LDAP URL for accessing the LDAP server when using\
 a stand-alone LDAP server.'),

idmap_rfc2307_ldap_user_dn_name : 'ldap_user_dn',
idmap_rfc2307_ldap_user_dn_placeholder: T('LDAP User DN'),
idmap_rfc2307_ldap_user_dn_tooltip: T('User Distinguished Name to use for authentication.'),

idmap_rfc2307_ldap_user_dn_pw_name : 'ldap_user_dn_password',
idmap_rfc2307_ldap_user_dn_pw_placeholder: T('LDAP User DN Password'),
idmap_rfc2307_ldap_user_dn_pw_tooltip: T('Password associated with the LDAP User DN.'),

idmap_rfc2307_ldap_realm_name : 'ldap_realm',
idmap_rfc2307_ldap_realm_placeholder: T('LDAP Realm'),
idmap_rfc2307_ldap_realm_tooltip: T('Performs authentication from an LDAP server.'),

idmap_rfc2307_ssl_name : 'ssl',
idmap_rfc2307_ssl_placeholder: T('Encryption Mode'),
idmap_rfc2307_ssl_tooltip: T('Choose an encryption mode.'),
idmap_rfc2307_ssl_options:
[{
label: 'Off',
value: 'OFF',
}, {
label: 'SSL',
value: 'ON',
}, {
label: 'STARTTLS',
value: 'START_TLS',
}],

idmap_rfc2307_cert_name : '',
idmap_rfc2307_cert_placeholder: T('Certificate'),
idmap_rfc2307_cert_tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. When no certificates are available, move to the Active Directory server and\
 create a Certificate Authority and Certificate. Import the certificate to this system using the\
 System/Certificates menu.'),

idmap_script_name : 'script',
idmap_script_placeholder: T('Script'),
idmap_script_tooltip: T('Configure an external program to perform ID mapping. See\
 <a href="http://samba.org.ru/samba/docs/man/manpages/idmap_script.8.html"\
 target="_blank">idmap_script(8)</a> for more details.'),


idmap_tdb_range_low_name : 'range_low',
idmap_tdb_range_low_placeholder: T('Range Low'),
idmap_tdb_range_low_tooltip: T('Beginning UID/GID number for which this system is\
 authoritative. UID/GID values below Range Low or higher than Range High are ignored.'),

idmap_tdb_range_high_name : 'range_high',
idmap_tdb_range_high_placeholder: T('Range High'),
idmap_tdb_range_high_tooltip: T('Ending UID/GID number for which this system is\
 authoritative. UID/GID values below Range Low or higher than Range High are ignored.'),

idmap_error_dialog_title: T('Error'),

idmap_range_validator: [Validators.required],

// idmap config table and form
idmap: {
    settings_label: T('Settings'),
    options_label: T('Options'),
    name: {
        placeholder: T('Name'),
        tooltip: T('Enter the pre-Windows 2000 domain name.'),
    },
    dns_domain_name: {
        placeholder: T('DNS Domain Name'),
        tooltip: T('DNS name of the domain')
    },
    range_low: {
        placeholder: T('Range Low'),
    },
    range_high: {
        placeholder: T('Range High'),
    },
    range_tooltip: T('Range Low and Range High set the range of UID/GID numbers which this \
 IDMap backend translates. If an external credential like a Windows SID maps to a UID or GID \
 number outside this range, the external credential is ignored.'),
    idmap_backend: {
        placeholder: T('Idmap Backend'),
        tooltip: T('Provides a plugin interface for Winbind to use varying backends to store \
 SID/uid/gid mapping tables. The correct setting depends on the environment in which the NAS is deployed.'),
        enum: [
            {label: T("AD"), value: "AD"},
            {label: T("AUTORID"), value: "AUTORID"},
            {label: T("LDAP"), value: "LDAP"},
            {label: T("NSS"), value: "NSS"},
            {label: T("RFC2307"), value: "RFC2307"},
            {label: T("RID"), value: "RID"},
            {label: T("TDB"), value: "TDB"}
        ]
    },
    certificate_id: {
        placeholder: T('Cerfiticate'),
        tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. When no certificates are available, move to the Active Directory server and\
 create a Certificate Authority and Certificate. Import the certificate to this system using the\
 System/Certificates menu.'),
    },
    schema_mode: {
        placeholder : T('Schema mode'),
        tooltip : T('Choose the schema to use with LDAP authentication for\
 SMB shares. The LDAP server must be configured with Samba attributes to use a Samba Schema. \
 Options include <i>RFC2307</i> (included in Windows 2003 R2) and <i>Service for Unix (SFU)</i>. \
 For SFU 3.0 or 3.5, choose "SFU". For SFU 2.0, choose "SFU20".'),
        options: [
            {label: T('RFC2307'), value: 'RFC2307'}, 
            {label: T('SFU'), value: 'SFU'},
            {label: T('SFU20'), value: 'SFU20'}
        ]
    },
    unix_primary_group: {
        placeholder: T('Unix Primary Group'),
        tooltip: T('When checked, the primary group membership is fetched from the LDAP \
 attributes (gidNumber). When not checked, the primary group membership is calculated via \
 the "primaryGroupID" LDAP attribute.')
    },
    unix_nss: {
        placeholder: T('Unix NSS Info'),
        tooltip: T('When checked, winbind will retrieve the login shell and home directory \
 from the LDAP attributes. When not checked or when the AD LDAP entry lacks the SFU attributes \
 the smb4.conf parameters <code>template shell</code> and <code>template homedir</code> are used.')
    },
    rangesize: {
        placeholder: T('Range Size'),
        tooltip: T('Need docs')
    },
    readonly: {
        placeholder: T('Read Only'),
        tooltip: T('Sets the module to read-only mode. No new ranges will be allocated and \
 new mappings will not be created in the idmap pool.')
    },
    ignore_builtin: {
        placeholder: T('Ignore Builtin'),
        tooltip: T('Ignores mapping requests for the BUILTIN domain.')
    },
    ldap_basedn: {
        placeholder: T('Base DN'),
        tooltip: T('The directory base suffix to use for SID/uid/gid\
 mapping entries. Example: dc=test,dc=org. When undefined, idmap_ldap defaults to using the ldap idmap\
 suffix option from <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf"\
 target="_blank">smb.conf</a>.')
    },
    ldap_userdn: {
        placeholder: T('User DN'),
        tooltip: T('User Distinguished Name (DN) to use for authentication.')
    },
    ldap_url: {
        placeholder: T('URL'),
        tooltip: T('LDAP server to use for SID/uid/gid map entries. When\
 undefined, idmap_ldap uses *ldap://localhost/*.\
 Example: <i>ldap://ldap.netscape.com/o=Airius.com</i>.')
    },
    ssl: {
        placeholder: T('Encryption Mode'),
        tooltip: T('Choose an encryption mode to use with LDAP.'),
        options: 
        [{
        label: T('Off'),
        value: 'OFF',
        }, {
        label: T('SSL'),
        value: 'ON',
        }, {
        label: T('STARTTLS'),
        value: 'START_TLS',
        }]
    },
    linked_service: {
        placeholder: T('Linked Service'),
        tooltip: T('Specifies the auxiliary directory service ID provider.'),
        options: [
            {label: T('Local Account'), value: 'LOCAL_ACCOUNT'},
            {label: T('LDAP'), value: 'LDAP'},
            {label: T('NIS'), value: 'NIS'}
          ]
    },
    ldap_user_dn_password: {
        placeholder: T('LDAP User DN Password'),
        tooltip: T('Password associated with the LDAP User DN.')
    },
    ldap_server: {
        placeholder: T('LDAP Server'),
        tooltip: T('Select the type of LDAP server to use. This can be the\
        LDAP server provided by the Active Directory server or a stand-alone LDAP server.')
    },
    bind_path_user: {
        placeholder: T('User Bind Path'),
    tooltip: T('The search base where user objects can be found in the LDAP server.')
    },
    bind_path_group: {
        placeholder: T('Group Bind Path'),
        tooltip: T('The search base where group objects can be found in the LDAP server.')
    },
    user_cn: {
        placeholder: T('User CN'),
        tooltip: T('Set to query the cn instead of uid attribute for the user name in LDAP.')
    },
    cn_realm: {
        placeholder: T('CN Realm'),
        tooltip: T('Append <i>@realm</i> to <i>cn</i> in LDAP queries for\
 both groups and users when User CN is set).')
    },
    ldap_domain: {
        placeholder: T('LDAP Domain'),
        tooltip: T('The domain to access the Active Directory server when\
 using the LDAP server inside the Active Directory server.')
    },
    sssd_compat: {
        placeholder: T('SSSD Compat'),
        tooltip: T('Generate idmap low range based on same algorithm that SSSD uses by default.')
    },
    enable_ad_dialog: {
        title: T('Enable Active Directory'), 
        message: T('Active Directory must be enabled before adding new domains.'),
        button: T('Go to Active Directory Form')
    },
    clear_cache_dialog: {
        title: T('Clear the Idmap Cache'),
        message: T('The Idmap cache should be cleared after finalizing idmap changes. \
 Click "Continue" to clear the cache.'),
        job_title: T('Clearing Cache...')
    }
        
}

}

