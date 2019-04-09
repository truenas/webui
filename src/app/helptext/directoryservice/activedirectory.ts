import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

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

activedirectory_domainname_name: 'ad_domainname',
activedirectory_domainname_placeholder: T('Domain Name'),
activedirectory_domainname_tooltip: T('Enter the Active Directory domain (<i>example.com</i>)\
 or child domain (<i>sales.example.com</i>).'),
activedirectory_domainname_validation: [ Validators.required ],

activedirectory_bindname_name: 'ad_bindname',
activedirectory_bindname_placeholder: T('Domain Account Name'),
activedirectory_bindname_tooltip: T('Enter the Active Directory administrator account name.'),
activedirectory_bindname_validation: [ Validators.required ],

activedirectory_bindpw_name: 'ad_bindpw',
activedirectory_bindpw_placeholder: T('Domain Account Password'),
activedirectory_bindpw_tooltip: T('Enter the administrator account password.'),

activedirectory_monitor_frequency_name: 'ad_monitor_frequency',
activedirectory_monitor_frequency_placeholder: T('Connectivity Check'),
activedirectory_monitor_frequency_tooltip: T('Enter how often in seconds for the system to verify\
 Active Directory services are functioning.'),

activedirectory_recover_retry_name: 'ad_recover_retry',
activedirectory_recover_retry_placeholder: T('Recovery Attempts'),
activedirectory_recover_retry_tooltip: T('Enter a number of times to attempt reconnecting to the\
 Active directory server. Tries forever when set to <i>0</i>.'),

activedirectory_enable_monitor_name: 'ad_enable_monitor',
activedirectory_enable_monitor_placeholder: T('Enable AD Monitoring'),
activedirectory_enable_monitor_tooltip : T('Set to restart Active Directory automatically if the\
 service disconnects.'),

activedirectory_ssl_name: 'ad_ssl',
activedirectory_ssl_placeholder: T('Encryption Mode'),
activedirectory_ssl_tooltip: T('Choose between <i>Off</i>, <a\
 href="http://info.ssl.com/article.aspx?id=10241"\
 target="_blank">SSL</a> or <a\
 href="https://hpbn.co/transport-layer-security-tls/"\
 target="_blank">TLS</a>.'),

activedirectory_certificate_name: 'ad_certificate',
activedirectory_certificate_placeholder: T('Certificate'),
activedirectory_certificate_tooltip: T('Select the certificate of the Active Directory server\
 if SSL connections are used. Add a certificate here by creating a\
 <a href="%%docurl%%/system.html%%webversion%%#cas" target="_blank">CA</a>,\
 then creating a certificate on the Active Directory server.\
 Import the certificate on this system with the\
 <a href="%%docurl%%/system.html%%webversion%%#certificates" target="_blank">Certificates</a>\
 menu.'),

activedirectory_verbose_logging_name: 'ad_verbose_logging',
activedirectory_verbose_logging_placeholder : T('Verbose logging'),
activedirectory_verbose_logging_tooltip : T('Set to log attempts to join the domain to\
 /var/log/messages.'),

activedirectory_unix_extensions_name: 'ad_unix_extensions',
activedirectory_unix_extensions_placeholder : T('UNIX extensions'),
activedirectory_unix_extensions_tooltip : T('Only set if the AD server is explicitly configured to \
 map permissions for UNIX users. Setting provides persistent UIDs and GUIDs. Leave unset to map users \
 and groups to the UID or GUID range configured in Samba.'),

activedirectory_trusted_doms_name: 'ad_allow_trusted_doms',
activedirectory_trusted_doms_placeholder : T('Allow Trusted Domains'),
activedirectory_trusted_doms_tooltip : T('When set, usernames do not include a domain name.\
 Unset to force domain names to be prepended to user names. One possible reason for unsetting this value\
 is to prevent username collisions when Allow Trusted Domains is set and there are identical usernames in\
 more than one domain.'),

activedirectory_default_dom_name: 'ad_use_default_domain',
activedirectory_default_dom_placeholder : T('Use Default Domain'),
activedirectory_default_dom_tooltip : T('Unset to prepend the domain name to the username.\
 Unset to prevent name collisions when Allow Trusted Domains is set and multiple domains use the same\
 username.'),

activedirectory_dns_updates_name: 'ad_allow_dns_updates',
activedirectory_dns_updates_placeholder : T('Allow DNS updates'),
activedirectory_dns_updates_tooltip : T('Set to enable Samba to do DNS updates when joining a domain.'),

activedirectory_disable_fn_cache_name: 'ad_disable_freenas_cache',
activedirectory_disable_fn_cache_placeholder : T('Disable FreeNAS Cache'),
activedirectory_disable_fn_cache_tooltip : T('Set to disable caching AD users and groups. This can\
 help when unable to bind to a domain with a large number of users or groups.'),

activedirectory_site_name: 'ad_site',
activedirectory_site_placeholder : T('Site Name'),
activedirectory_site_tooltip : T('Enter the relative distinguished name of the\
 site object in the Active Directory.'),

activedirectory_dcname_name: 'ad_dcname',
activedirectory_dcname_placeholder : T('Domain Controller'),
activedirectory_dcname_tooltip : T('The server that manages user authentication and security as part of a\
 Windows domain. Leave empty to use the DNS SRV records to automatically detect and connect to the domain\
 controller. If the domain controller must be set manually, enter the server hostname or IP address.'),

activedirectory_gcname_name: 'ad_gcname',
activedirectory_gcname_placeholder : T('Global Catalog Server'),
activedirectory_gcname_tooltip : T('This holds a full set of attributes for the domain in which it resides\
 and a subset of attributes for all objects in the Microsoft Active Directory Forest. See the\
 <a href="https://www.ibm.com/support/knowledgecenter/en/SSEQTP_9.0.0/com.ibm.websphere.base.doc/ae/csec_was_ad_globcat.html" target="_blank">IBM\
 Knowledge Center</a>. Leave empty to use the DNS SRV records to automatically detect and connect to the\
 server. If the global catalog server must be entered manually, enter the server hostname or IP address.'),

activedirectory_kerberos_realm_name: 'ad_kerberos_realm',
activedirectory_kerberos_realm_placeholder : T('Kerberos Realm'),
activedirectory_kerberos_realm_tooltip : T('Select the realm created in\
 <a href="%%docurl%%/directoryservices.html%%webversion%%#kerberos-realms"\
 target="_blank">Kerberos Realms</a>.'),

activedirectory_kerberos_principal_name: 'ad_kerberos_principal',
activedirectory_kerberos_principal_placeholder : T('Kerberos Principal'),
activedirectory_kerberos_principal_tooltip : T('Select the keytab created in\
 <a href="%%docurl%%/directoryservices.html%%webversion%%#kerberos-keytabs"\
 target="_blank">Kerberos Keytabs</a>.'),

activedirectory_timeout_name: 'ad_timeout',
activedirectory_timeout_placeholder : T('AD Timeout'),
activedirectory_timeout_tooltip : T('Number of seconds before timeout. If the AD service\
 does not immediately start after connecting to the domain, increase this value.'),

activedirectory_dns_timeout_name: 'ad_dns_timeout',
activedirectory_dns_timeout_placeholder : T('DNS Timeout'),
activedirectory_dns_timeout_tooltip : T('Number of seconds before a timeout. Increase this\
 value if AD DNS queries time out.'),

activedirectory_idmap_backend_name: 'ad_idmap_backend',
activedirectory_idmap_backend_placeholder : T('Idmap backend'),
activedirectory_idmap_backend_tooltip : T('Choose the backend to map Windows security\
 identifiers (SIDs) to UNIX UIDs and GIDs. Click Edit to configure that backend.'),

activedirectory_nss_info_name: 'ad_nss_info',
activedirectory_nss_info_placeholder : T('Winbind NSS Info'),
activedirectory_nss_info_tooltip : T('Choose the schema to use when querying AD for\
 user/group info. <i>rfc2307</i> uses the schema support included in Windows 2003 R2, <i>sfu</i> is for\
 Service For Unix 3.0 or 3.5, and <i>sfu20</i> is for Service For Unix 2.0.'),

activedirectory_sasl_wrapping_name: 'ad_ldap_sasl_wrapping',
activedirectory_sasl_wrapping_placeholder : T('SASL wrapping'),
activedirectory_sasl_wrapping_tooltip : T('Choose how LDAP traffic is transmitted. Choices are\
 <i>plain</i> (plain text), <i>sign</i> (signed only), or <i>seal</i> (signed and encrypted). Windows 2000 SP3\
 and newer can be configured to enforce signed LDAP connections.'),

activedirectory_enable_name: 'ad_enable',
activedirectory_enable_placeholder : T('Enable'),
activedirectory_enable_tooltip : T('Set to enable the Active Directory service.'),

activedirectory_netbiosname_a_name: 'ad_netbiosname_a',
activedirectory_netbiosname_a_placeholder : T('Netbios Name'),
activedirectory_netbiosname_a_tooltip : T('Netbios Name of this NAS. This name must differ from\
 the <i>Workgroup</i> name and be no greater than 15 characters.'),
activedirectory_netbiosname_a_validation : [Validators.required, Validators.maxLength(15)],

activedirectory_netbiosalias_name: 'ad_netbiosalias',
activedirectory_netbiosalias_placeholder : T('NetBIOS alias'),
activedirectory_netbiosalias_tooltip : T('Alternative names that SMB clients can use when\
 connecting to this NAS. Can be no greater than 15 characters.'),

 activedirectory_advanced_fields: [
'ad_ssl',
'ad_certificate',
'ad_verbose_logging',
'ad_unix_extensions',
'ad_allow_trusted_doms',
'ad_use_default_domain',
'ad_allow_dns_updates',
'ad_disable_freenas_cache',
'ad_site',
'ad_dcname',
'ad_gcname',
'ad_kerberos_realm',
'ad_kerberos_principal',
'ad_timeout',
'ad_dns_timeout',
'ad_idmap_backend',
'ad_nss_info',
'ad_ldap_sasl_wrapping',
'ad_netbiosname_a',
'ad_netbiosalias',
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
 href="%%docurl%%/directoryservices.html%%webversion%%#id12"\
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