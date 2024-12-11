import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceSmb = {
  cifs_srv_netbiosname_tooltip: T('Automatically populated with the original hostname\
 of the system. This name is limited to 15 characters and\
 cannot be the <b>Workgroup</b> name.'),
  cifs_srv_netbiosalias_tooltip: T('Enter any aliases, separated by spaces.\
 Each alias can be up to 15 characters long.'),
  cifs_srv_workgroup_tooltip: T('Must match Windows workgroup name. \
 When this is unconfigured and Active Directory or LDAP are active, \
 TrueNAS will detect and set the correct workgroup from these services.'),
  cifs_srv_description_tooltip: T('Optional. Enter a server description.'),
  cifs_srv_enable_smb1_tooltip: T('Use this option to allow legacy SMB clients to connect to the\
  server. Note that SMB1 is being deprecated and it is advised\
  to upgrade clients to operating system versions that support\
  modern versions of the SMB protocol.'),
  cifs_srv_ntlmv1_auth_tooltip: T('Off by default. When set,\
 <a href="https://www.samba.org/samba/docs/current/man-html/smbd.8.html" target="_blank">smbd(8)</a>\
 attempts to authenticate users with the insecure\
 and vulnerable NTLMv1 encryption. This setting allows\
 backward compatibility with older versions of Windows,\
 but is not recommended and should not be used on\
 untrusted networks.'),

  cifs_srv_unixcharset_tooltip: T('Default is UTF-8 which supports all characters in\
 all languages.'),
  cifs_srv_debug_tooltip: T('Use this option to log more detailed information about SMB.'),
  cifs_srv_syslog_tooltip: T('Set to log authentication failures in <i>/var/log/messages</i>\
 instead of the default of <i>/var/log/samba4/log.smbd</i>.'),
  cifs_srv_localmaster_tooltip: T('Set to determine if the system participates in\
 a browser election. Leave unset when the network contains an AD\
 or LDAP server, or when Vista or Windows 7 machines\
 are present.'),
  cifs_srv_aapl_extensions_tooltip: T('These \
 <a href="https://support.apple.com/en-us/HT210803" target="_blank">protocol extensions</a> \
 can be used by macOS to improve the performance and behavioral characteristics of SMB shares. \
 This is required for Time Machine support.'),
  cifs_srv_multichannel_tooltip: T('SMB multichannel allows servers to use multiple network connections \
 simultaneously by combining the bandwidth of several network interface cards (NICs) for \
 better performance. SMB multichannel does not function if you combine NICs into a LAGG.\
 <a href="https://www.truenas.com/docs/scale/scaletutorials/shares/smb/smbmultichannel/" target="_blank">Read more in docs</a>'),
  cifs_srv_guest_tooltip: T('Account to be used for guest access. Default is \
 <i>nobody</i>. The chosen account is required to have permissions to the \
 shared pool or dataset. To adjust permissions, edit the dataset Access \
 Control List (ACL), add a new entry for the chosen guest account, and \
 configure the permissions in that entry. If the selected <i>Guest Account</i> \
 is deleted the field resets to <i>nobody</i>.'),
  cifs_srv_filemask_tooltip: T('Overrides default file creation mask of <i>0666</i> \
 which creates files with read and write access for everybody.'),
  cifs_srv_dirmask_tooltip: T('Overrides default directory creation mask of <i>0777</i> \
 which grants directory read, write and execute access for everybody.'),
  cifs_srv_admin_group_tooltip: T('Members of this group are local admins\
 and automatically have privileges to take ownership of any file in an SMB\
 share, reset permissions, and administer the SMB server through the\
 Computer Management MMC snap-in.'),
  cifs_srv_smb_options_tooltip: T('Enter additional <b>smb.conf</b> options. See the \
 <a href="http://www.oreilly.com/openbook/samba/book/appb_02.html" target="_blank">Samba Guide</a> \
 for more information on these settings.<br> \
 To log more details when a client attempts to authenticate to the share, add \
 <code>log level = 1, auth_audit:5</code>.'),
  cifs_srv_bindip_tooltip: T('Static IP addresses which SMB listens on for connections. \
 Leaving all unselected defaults to listening on all active interfaces.'),
};
