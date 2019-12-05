import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';
import globalHelptext from '../../helptext/global-helptext';

export default {
activedirectory_custactions_basic_id: 'basic_mode',
activedirectory_custactions_basic_name: T('Basic Mode'),
activedirectory_custactions_advanced_id: 'advanced_mode',
activedirectory_custactions_advanced_name: T('Advanced Mode'),
activedirectory_custactions_edit_imap_id: 'edit_idmap',
activedirectory_custactions_edit_imap_name: T('Edit Idmap'),
activedirectory_custactions_clearcache_id: 'ds_clearcache',
activedirectory_custactions_clearcache_name: T('Rebuild Directory Service Cache'),
activedirectory_custactions_clearcache_dialog_title: T("Active Directory"),
activedirectory_custactions_clearcache_dialog_message: T("The cache is being rebuilt."),
activedirectory_custactions_leave_domain: T("Leave Domain"),

ad_leave_domain_dialog: {
    message: T('Leaving the domain requires sufficient privileges. Enter your credentials below.'),
    username: T('Username'),
    pw: T('Password'),
    error: T('Error'),
    success: T('Success'),
    success_msg: T('You have left the domain.')
},

ad_section_headers: {
    dc: T('Domain Credentials')
},

activedirectory_domainname_name: 'domainname',
activedirectory_domainname_placeholder: T('Domain Name'),
activedirectory_domainname_tooltip: T('Enter the Active Directory domain (<i>example.com</i>)\
 or child domain (<i>sales.example.com</i>).'),
activedirectory_domainname_validation: [ Validators.required ],

activedirectory_bindname_name: 'bindname',
activedirectory_bindname_placeholder: T('Domain Account Name'),
activedirectory_bindname_tooltip: T('Enter the Active Directory administrator account name.'),
activedirectory_bindname_validation: [ Validators.required ],

activedirectory_bindpw_name: 'bindpw',
activedirectory_bindpw_placeholder: T('Domain Account Password'),
activedirectory_bindpw_tooltip: T('Enter the administrator account password.'),

activedirectory_ssl_name: 'ssl',
activedirectory_ssl_placeholder: T('Encryption Mode'),
activedirectory_ssl_tooltip: T('Choose between <i>Off</i>, <a\
 href="http://info.ssl.com/article.aspx?id=10241"\
 target="_blank">SSL</a> or <a\
 href="https://hpbn.co/transport-layer-security-tls/"\
 target="_blank">TLS</a>.'),

activedirectory_certificate_name: 'certificate',
activedirectory_certificate_placeholder: T('Certificate'),
activedirectory_certificate_tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. Add a certificate here by creating a\
 <a href="--docurl--/system.html#cas" target="_blank">CA</a>,\
 then creating a certificate on the Active Directory server.\
 Import the certificate on this system with the\
 <a href="--docurl--/system.html#certificates" target="_blank">Certificates</a>\
 menu.'),

ad_validate_certificates_placeholder: T('Validate Certificates'),
ad_validate_certificates_tooltip: T('Check server certificates in a TLS session.'),

activedirectory_verbose_logging_name: 'verbose_logging',
activedirectory_verbose_logging_placeholder : T('Verbose logging'),
activedirectory_verbose_logging_tooltip : T('Set to log attempts to join the domain to\
 /var/log/messages.'),

activedirectory_trusted_doms_name: 'allow_trusted_doms',
activedirectory_trusted_doms_placeholder : T('Allow Trusted Domains'),
activedirectory_trusted_doms_tooltip : T('When set, usernames do not include a domain name.\
 Unset to force domain names to be prepended to user names. One possible reason for unsetting this value\
 is to prevent username collisions when Allow Trusted Domains is set and there are identical usernames in\
 more than one domain.'),

activedirectory_default_dom_name: 'use_default_domain',
activedirectory_default_dom_placeholder : T('Use Default Domain'),
activedirectory_default_dom_tooltip : T('Unset to prepend the domain name to the username.\
 Unset to prevent name collisions when Allow Trusted Domains is set and multiple domains use the same\
 username.'),

activedirectory_dns_updates_name: 'allow_dns_updates',
activedirectory_dns_updates_placeholder : T('Allow DNS updates'),
activedirectory_dns_updates_tooltip : T('Set to enable Samba to do DNS updates when joining a domain.'),

activedirectory_disable_fn_cache_name: 'disable_freenas_cache',
activedirectory_disable_fn_cache_placeholder : T('Disable FreeNAS Cache'),
activedirectory_disable_fn_cache_tooltip : T('Set to disable caching AD users and groups. This can\
 help when unable to bind to a domain with a large number of users or groups.'),

activedirectory_site_name: 'site',
activedirectory_site_placeholder : T('Site Name'),
activedirectory_site_tooltip : T('Enter the relative distinguished name of the\
 site object in the Active Directory.'),

activedirectory_kerberos_realm_name: 'kerberos_realm',
activedirectory_kerberos_realm_placeholder : T('Kerberos Realm'),
activedirectory_kerberos_realm_tooltip : T('Select the realm created in\
 <a href="--docurl--/directoryservices.html#kerberos-realms"\
 target="_blank">Kerberos Realms</a>.'),

activedirectory_kerberos_principal_name: 'kerberos_principal',
activedirectory_kerberos_principal_placeholder : T('Kerberos Principal'),
activedirectory_kerberos_principal_tooltip : T('Select the keytab created in\
 <a href="--docurl--/directoryservices.html#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a>.'),

computer_account_OU_name: T('createcomputer'),
computer_account_OU_placeholder: T('Computer Account OU'),
computer_account_OU_tooltip: T('The OU in which new computer accounts are created. \
 The OU string is read from top to bottom without RDNs. Slashes ("/") are used as \
 delimiters, like <samp>Computers/Servers/NAS</samp>. The backslash ("\\") is \
 used to escape characters but not as a separator. Backslashes are interpreted at \
 multiple levels and might require doubling or even quadrupling to take effect. \
 When this field is blank, new computer accounts are created in the Active Directory \
 default OU.'),

activedirectory_timeout_name: 'timeout',
activedirectory_timeout_placeholder : T('AD Timeout'),
activedirectory_timeout_tooltip : T('Number of seconds before timeout. If the AD service\
 does not immediately start after connecting to the domain, increase this value.'),

activedirectory_dns_timeout_name: 'dns_timeout',
activedirectory_dns_timeout_placeholder : T('DNS Timeout'),
activedirectory_dns_timeout_tooltip : T('Number of seconds before a timeout. Increase this\
 value if AD DNS queries time out.'),

activedirectory_idmap_backend_name: 'idmap_backend',
activedirectory_idmap_backend_placeholder : T('Idmap backend'),
activedirectory_idmap_backend_tooltip : T('Choose the backend to map Windows security\
 identifiers (SIDs) to UNIX UIDs and GIDs. Click Edit to configure that backend.'),

activedirectory_nss_info_name: 'nss_info',
activedirectory_nss_info_placeholder : T('Winbind NSS Info'),
activedirectory_nss_info_tooltip : T('Choose the schema to use when querying AD for\
 user/group info. <i>rfc2307</i> uses the schema support included in Windows 2003 R2, <i>sfu</i> is for\
 Service For Unix 3.0 or 3.5, and <i>sfu20</i> is for Service For Unix 2.0.'),

activedirectory_sasl_wrapping_name: 'ldap_sasl_wrapping',
activedirectory_sasl_wrapping_placeholder : T('SASL wrapping'),
activedirectory_sasl_wrapping_tooltip : T('Choose how LDAP traffic is transmitted. Choices are\
 <i>plain</i> (plain text), <i>sign</i> (signed only), or <i>seal</i> (signed and encrypted). Windows 2000 SP3\
 and newer can be configured to enforce signed LDAP connections.'),

activedirectory_enable_name: 'enable',
activedirectory_enable_placeholder : T('Enable (requires password'),
activedirectory_enable_tooltip : T('Set to enable the Active Directory service.\
 Selecting this option requires the Domain Account Password.'),

activedirectory_netbiosname_a_name: 'netbiosname',
activedirectory_netbiosname_a_placeholder : T('Netbios Name'),
activedirectory_netbiosname_a_tooltip : T('Netbios Name of this NAS. This name must differ from\
 the <i>Workgroup</i> name and be no greater than 15 characters.'),
activedirectory_netbiosname_a_validation : [Validators.required, Validators.maxLength(15)],

activedirectory_netbiosname_b_name: 'netbiosname_b',
activedirectory_netbiosname_b_placeholder : T(`Netbios Name (${globalHelptext.Ctrlr} 2)`),
activedirectory_netbiosname_b_tooltip : T('Netbios Name of this NAS. This name must differ from\
 the <i>Workgroup</i> name and be no greater than 15 characters.'),
activedirectory_netbiosname_b_validation : [Validators.required, Validators.maxLength(15)],

activedirectory_netbiosalias_name: 'netbiosalias',
activedirectory_netbiosalias_placeholder : T('NetBIOS alias'),
activedirectory_netbiosalias_tooltip : T('Alternative names that SMB clients can use when\
 connecting to this NAS. Can be no greater than 15 characters.'),

 activedirectory_advanced_fields: [
'ssl',
'certificate',
'validate_certificates',
'verbose_logging',
'unix_extensions',
'allow_trusted_doms',
'use_default_domain',
'allow_dns_updates',
'disable_freenas_cache',
'site',
'dcname',
'gcname',
'kerberos_realm',
'kerberos_principal',
'createcomputer',
'timeout',
'dns_timeout',
'idmap_backend',
'nss_info',
'ldap_sasl_wrapping',
'netbiosname',
'netbiosname_b',
'netbiosalias'
],

activedirectory_idmap_change_dialog_title: T("Active Directory IDMAP change!"),
activedirectory_idmap_change_dialog_message: T('<font color="red">WARNING</font>: use <i>rid</i> or\
 <i>autorid</i> for networks with only Windows computers,\
 like most home networks. Mac computers joined to Active\
 Directory can also be used with <i>rid</i> and\
 <i>autorid</i>. Both of these backends have been\
 preconfigured to work with this NAS. Other idmap_backend\
 values are for use in larger or mixed networks with Windows\
 and other operating systems. DO NOT CHANGE THE idmap_backend\
 SETTING UNLESS REQUIRED TO WORK WITH A MIXED NETWORK AND THE\
 PROPER CONFIGURATION HAS ALREADY BEEN DETERMINED. For\
 reference, see <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_rid"\
 target="_blank">idmap_rid(8)</a>, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_autorid"\
 target="_blank">idmap_autorid(8)</a>\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_ad"\
 target="_blank">ad</a>\, <a\
 href="--docurl--/directoryservices.html#id12"\
 target="_blank">fruit</a>\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_ldap"\
 target="_blank">idmap_ldap(8)</a>\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_nss"\
 target="_blank">idmap_nss(8)</a>\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_rfc2307"\
 target="_blank">idmap_rfc2307(8)\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_script"\
 target="_blank">idmap_script(8)</a>\, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_tdb"\
 target="_blank">tdb</a>\, and <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=idmap_tdb2"\
 target="_blank">idmap_tdb2(8)</a>')
}
