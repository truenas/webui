import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextActiveDirectory = {
  activedirectory_custactions_clearcache_dialog_message: T('The cache is being rebuilt.'),

  ad_leave_domain_dialog: {
    error: T('Error'),
    success_msg: T('You have left the domain.'),
  },

  activedirectory_domainname_tooltip: T('Enter the Active Directory domain (<i>example.com</i>)\
 or child domain (<i>sales.example.com</i>).'),
  activedirectory_bindname_tooltip: T('Enter the Active Directory administrator account name.'),
  activedirectory_bindpw_tooltip: T('Password for the Active Directory administrator account. \
 Required the first time a domain is configured. After initial configuration, the password \
 is not needed to edit, start, or stop the service.'),
  activedirectory_verbose_logging_tooltip: T('Increase logging verbosity related to the\
 active directory service in /var/log/middlewared.log'),
  activedirectory_trusted_doms_tooltip: T('Allow clients to access the TrueNAS server if they are members\
 of domains that have a trust relationship with the domain to which TrueNAS is joined.\
 This requires valid idmap backend configuration for all trusted domains.'),
  activedirectory_default_dom_tooltip: T('AD users and groups by default will have a domain name prefix (`DOMAIN\\`).\
 In some edge cases this may cause erratic behavior from some clients and applications that are poorly\
 designed and cannot handle the prefix. Set only if required for a specific application or client.\
 Note that using this setting is not recommended as it may cause collisions with local user account names.'),
  activedirectory_dns_updates_tooltip: T('Set to enable Samba to do DNS updates when joining a domain.'),
  activedirectory_disable_fn_cache_tooltip: T('TrueNAS maintains a cache of users and groups for API consumers\
 (including the WebUI). This is a convenience feature that may be disabled if the domain contains large\
 numbers of users and groups or if the caching generates excessive load on the domain controller.'),

  restrict_pam: {
    tooltip: T('Set to restrict SSH access in certain circumstances to only members of \
 BUILTIN\\Administrators'),
  },

  activedirectory_site_tooltip: T('Enter the relative distinguished name of the\
 site object in the Active Directory.'),
  activedirectory_kerberos_realm_tooltip: T('Select an existing realm that was added \
 in <b>Directory Services > Kerberos Realms</b>.'),
  activedirectory_kerberos_principal_tooltip: T('Select the location of the principal in the \
 keytab created in <b>Directory Services > Kerberos Keytabs</b>.'),
  computer_account_OU_tooltip: T('The OU in which new computer accounts are created. \
 The OU string is read from top to bottom without RDNs. Slashes ("/") are used as \
 delimiters, like <samp>Computers/Servers/NAS</samp>. The backslash ("\\") is \
 used to escape characters but not as a separator. Backslashes are interpreted at \
 multiple levels and might require doubling or even quadrupling to take effect. \
 When this field is blank, new computer accounts are created in the Active Directory \
 default OU.'),
  activedirectory_timeout_tooltip: T('Number of seconds before timeout. To view the AD \
 connection status, open the interface <i>Task Manager</i>.'),
  activedirectory_dns_timeout_tooltip: T('Number of seconds before a timeout. Increase this\
 value if AD DNS queries time out.'),
  activedirectory_idmap_backend_tooltip: T('Choose the backend to map Windows security\
 identifiers (SIDs) to UNIX UIDs and GIDs. Click Edit to configure that backend.'),
  activedirectory_nss_info_tooltip: T('Choose the schema to use when querying AD for\
 user/group info. <i>rfc2307</i> uses the schema support included in Windows 2003 R2, <i>sfu</i> is for\
 Service For Unix 3.0 or 3.5, and <i>sfu20</i> is for Service For Unix 2.0.'),
  activedirectory_enable_tooltip: T('Enable the Active Directory service.\
 The first time this option is set, the Domain Account Password must be entered.'),
  activedirectory_netbiosname_tooltip: T('NetBIOS Name of this NAS. This name must differ from\
 the <i>Workgroup</i> name and be no greater than 15 characters.'),
  activedirectory_netbiosalias_tooltip: T('Alternative names that SMB clients can use when\
 connecting to this NAS. Can be no greater than 15 characters.'),
};
