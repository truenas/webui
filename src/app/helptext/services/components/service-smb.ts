import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';
import globalHelptext from '../../../helptext/global-helptext';

export default {
cifs_srv_fieldset_netbios: T('NetBIOS'),
cifs_srv_fieldset_idmap: T('IDMAP'),
cifs_srv_fieldset_other: T('Other Options'),

cifs_srv_netbiosname_placeholder: T('NetBIOS Name'),
cifs_srv_netbiosname_tooltip: T('Automatically populated with the original hostname\
 of the system. This name is limited to 15 characters and\
 cannot be the <b>Workgroup</b> name.'),
cifs_srv_netbiosname_validation : [ Validators.required, Validators.maxLength(15) ],

cifs_srv_netbiosname_b_placeholder: T(`NetBIOS Name (${globalHelptext.Ctrlr} 2)`),
cifs_srv_netbiosname_b_tooltip: T('Automatically populated with the original hostname\
 of the system. This name is limited to 15 characters and\
 cannot be the <b>Workgroup</b> name.'),
cifs_srv_netbiosname_b_validation : [ Validators.required, Validators.maxLength(15) ],

cifs_srv_netbiosalias_placeholder: T('NetBIOS Alias'),
cifs_srv_netbiosalias_tooltip: T('Enter any aliases, separated by spaces.\
 Each alias can be up to 15 characters long.'),
cifs_srv_netbiosalias_errmsg: T('Aliases must be 15 characters or less.'),

cifs_srv_workgroup_placeholder: T('Workgroup'),
cifs_srv_workgroup_tooltip: T('Must match Windows workgroup name. \
 When this is unconfigured and Active Directory or LDAP are active, \
 TrueNAS will detect and set the correct workgroup from these services.'),
cifs_srv_workgroup_validation : [ Validators.required ],

cifs_srv_description_placeholder: T('Description'),
cifs_srv_description_tooltip: T('Optional. Enter a server description.'),

cifs_srv_unixcharset_placeholder: T('UNIX Charset'),
cifs_srv_unixcharset_tooltip: T('Default is UTF-8 which supports all characters in\
 all languages.'),

cifs_srv_loglevel_placeholder: T('Log Level'),
cifs_srv_loglevel_tooltip: T('Record SMB service messages up to the specified log level. \
 By default, error and warning level messages are logged.'),
cifs_srv_loglevel_options: [
  { label: T('None'), value: 'NONE' },
  { label: T('Minimum'), value: 'MINIMUM' },
  { label: T('Normal'), value: 'NORMAL' },
  { label: T('Full'), value: 'FULL' },
  { label: T('Debug'), value: 'DEBUG' },
],

cifs_srv_syslog_placeholder: T('Use Syslog Only'),
cifs_srv_syslog_tooltip: T('Set to log authentication failures in <i>/var/log/messages</i>\
 instead of the default of <i>/var/log/samba4/log.smbd</i>.'),

cifs_srv_localmaster_placeholder: T('Local Master'),
cifs_srv_localmaster_tooltip: T('Set to determine if the system participates in\
 a browser election. Leave unset when the network contains an AD\
 or LDAP server, or when Vista or Windows 7 machines\
 are present.'),

cifs_srv_aapl_extensions_placeholder: T('Enable Apple SMB2/3 Protocol Extensions'),
cifs_srv_aapl_extensions_tooltip: T('These \
 <a href="https://support.apple.com/en-us/HT210803" target="_blank">protocol extensions</a> \
 can be used by macOS to improve the performance and behavioral characteristics of SMB shares. \
 This is required for Time Machine support.'),

cifs_srv_guest_placeholder: T('Guest Account'),
cifs_srv_guest_tooltip: T('Account to be used for guest access. Default is \
 <i>nobody</i>. The chosen account is required to have permissions to the \
 shared pool or dataset. To adjust permissions, edit the dataset Access \
 Control List (ACL), add a new entry for the chosen guest account, and \
 configure the permissions in that entry. If the selected <i>Guest Account</i> \
 is deleted the field resets to <i>nobody</i>.'),

cifs_srv_filemask_placeholder: T('File Mask'),
cifs_srv_filemask_tooltip: T('Overrides default file creation mask of <i>0666</i> \
 which creates files with read and write access for everybody.'),

cifs_srv_dirmask_placeholder: T('Directory Mask'),
cifs_srv_dirmask_tooltip: T('Overrides default directory creation mask of <i>0777</i> \
 which grants directory read, write and execute access for everybody.'),

cifs_srv_admin_group_placeholder: T('Administrators Group'),
cifs_srv_admin_group_tooltip: T('Members of this group are local admins\
 and automatically have privileges to take ownership of any file in an SMB\
 share, reset permissions, and administer the SMB server through the\
 Computer Management MMC snap-in.'),
 cifs_srv_admin_group_validation : [ Validators.maxLength(120) ],

cifs_srv_smb_options_placeholder: T('Auxiliary Parameters'),
cifs_srv_smb_options_tooltip: T('Enter additional <b>smb.conf</b> options. See the \
 <a href="http://www.oreilly.com/openbook/samba/book/appb_02.html" target="_blank">Samba Guide</a> \
 for more information on these settings.<br> \
 To log more details when a client attempts to authenticate to the share, add \
 <code>log level = 1, auth_audit:5</code>.'),

cifs_srv_ntlmv1_auth_placeholder: T('NTLMv1 Auth'),
cifs_srv_ntlmv1_auth_tooltip: T('Off by default. When set,\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=smbd" target="_blank">smbd(8)</a>\
 attempts to authenticate users with the insecure\
 and vulnerable NTLMv1 encryption. This setting allows\
 backward compatibility with older versions of Windows,\
 but is not recommended and should not be used on\
 untrusted networks.'),

cifs_srv_bindip_placeholder: T('Bind IP Addresses'),
cifs_srv_bindip_tooltip: T('Static IP addresses which SMB listens on for connections. \
 Leaving all unselected defaults to listening on all active interfaces.'),

idmap_tdb_range_low_placeholder: T('Range Low'),
idmap_tdb_range_low_tooltip: T('The beginning UID/GID for which this system is\
 authoritative. Any UID/GID lower than this value is ignored.\
 This avoids accidental UID/GID overlaps between local and remotely\
 defined IDs.'),
 idmap_tdb_range_low_validation: [regexValidator(/^\d+$/)],

idmap_tdb_range_high_placeholder: T('Range High'),
idmap_tdb_range_high_tooltip: T('The ending UID/GID for which this system is authoritative.\
 Any UID/GID higher than this value is ignored.\
 This avoids accidental UID/GID overlaps between local\
 and remotely defined IDs.'),


cifs_srv_enable_smb1_placeholder: T('Enable SMB1 support'),
cifs_srv_enable_smb1_tooltip: T('Use this option to allow legacy SMB clients to connect to the\
 server. Note that SMB1 is being deprecated and it is advised\
 to upgrade clients to operating system versions that support\
 modern versions of the SMB protocol.'),

 formTitle: T('SMB')
}
