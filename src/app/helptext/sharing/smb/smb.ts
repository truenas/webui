import { T } from "app/translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_smb = {
    fieldset_basic: T('Basic'),
    fieldset_advanced: T('Advanced'),
    fieldset_access: T('Access'),
    fieldset_other: T('Other Options'),

    column_name: T('Name'),
    column_path: T('Path'),
    column_comment: T('Description'),
    column_enabled: T('Enabled'),

    placeholder_path: T('Path'),
    tooltip_path: T('Select pool, dataset, or directory to share.'),
    validators_path: [ Validators.required ],
    errormsg_name: T("<i>global</i> is a reserved name that cannot be used as a share\
 name. Please enter a different share name."),

    placeholder_name: T('Name'),
    tooltip_name: T('Enter a name for the share.'),

    placeholder_comment: T("Description"),
    tooltip_comment: T(
      "Description of the share or notes on how it is used."
    ),

    placeholder_enabled: T('Enabled'),
    tooltip_enabled: T('Enable this SMB share. Unset to disable this SMB share \
 without deleting it.'),

    placeholder_home: T('Use as Home Share'),
    tooltip_home: T('Allows the share to host user home \
 directories. Each user is given a personal home directory when \
 connecting to the share which is not accessible by other users. This \
 allows for a personal, dynamic share. Only one share can be used \
 as the home share.'),

    placeholder_purpose: T('Purpose'),
    tooltip_purpose: T('Select a preset configuration for the share. This\
 applies predetermined values and disables changing some share options.'),

   placeholder_timemachine: T('Time Machine'),
   tooltip_timemachine: T('Enable Time Machine backups on this share.'),

    placeholder_default_permissions: T('Default Permissions'),
    tooltip_default_permissions: T('When enabled, the ACLs grant read and \
 write access for owner or group and read-only for others. <b>Only</b> leave \
 unset when creating a share on a system that already has custom ACLs configured.'),

    placeholder_acl: T('Enable ACL'),
    tooltip_acl: T('Enable ACL support for the SMB share. Disabling ACL \
 support for a share deletes that ACL.'),

    placeholder_ro: T('Export Read Only'),
    tooltip_ro: T('Prohibits writes to this share.'),

    placeholder_browsable: T('Browsable to Network Clients'),
    tooltip_browsable: T('Determine whether this share name is included\
 when browsing shares. Home shares are only visible to the owner\
 regardless of this setting.'),

    placeholder_recyclebin: T('Export Recycle Bin'),
    tooltip_recyclebin: T('Files that are deleted from the same \
 dataset are moved to the Recycle Bin and do not take any additional \
 space. When the files are in a different dataset or a child dataset, \
 they are copied to the dataset where the Recycle Bin is located. To \
 prevent excessive space usage, files larger than 20 MiB are deleted \
 rather than moved. Adjust the <i>Auxiliary Parameter</i> \
 <samp>crossrename:sizelimit=</samp> setting to allow larger files. \
 For example, <samp>crossrename:sizelimit={50}</samp> allows moves of \
 files up to 50 MiB in size.'),

    placeholder_guestok: T('Allow Guest Access'),
    tooltip_guestok: T('Privileges are the same as the guest account. \
 Guest access is disabled by default in Windows 10 version 1709 and \
 Windows Server version 1903. Additional client-side configuration is \
 required to provide guest access to these clients.<br><br> \
 <i>MacOS clients:</i> Attempting to connect as a user that does not \
 exist in FreeNAS <i>does not</i> automatically connect as the guest \
 account. The <b>Connect As:</b> <i>Guest</i> option must be \
 specifically chosen in MacOS to log in as the guest account. See the \
 <a href="https://support.apple.com/guide/mac-help/connect-mac-shared-computers-servers-mchlp1140/" target="_blank">Apple documentation</a> \
 for more details.'),

    placeholder_abe: T('Access Based Share Enumeration'),
    tooltip_abe: T('Restrict share visibility to users with read or write access\
 to the share. See <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf"\
 target=_blank>smb.conf(5)</a>.'),

    placeholder_hostsallow: T('Hosts Allow'),
    tooltip_hostsallow: T('Enter a list of allowed hostnames or IP addresses.\
 Separate entries by pressing <code>Enter</code>. A more detailed description \
 with examples can be found \
 <a href="https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html#HOSTSALLOW">here</a>.'),

    placeholder_hostsdeny: T('Hosts Deny'),
    tooltip_hostsdeny: T('Enter a list of denied hostnames or IP addresses.\
 Separate entries by pressing <code>Enter</code>.'),

    placeholder_shadowcopy: T('Enable Shadow Copies'),
    tooltip_shadowcopy: T('Export ZFS snapshots as\
 <a href="https://docs.microsoft.com/en-us/windows/desktop/vss/shadow-copies-and-shadow-copy-sets"\
 target=_blank>Shadow Copies</a> for VSS clients.'),

    placeholder_auxsmbconf: T('Auxiliary Parameters'),
    tooltip_auxsmbconf: T('Additional \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf" target="_blank">smb.conf</a> \
 parameters.'),

    placeholder_aapl_name_mangling: T('Use Apple-style Character Encoding'),
    tooltip_aapl_name_mangling: T('By default, Samba uses a hashing algorithm for NTFS illegal \
 characters. Enabling this option translates NTFS illegal characters to the Unicode private range.'),

    placeholder_streams: T('Enable Alternate Data Streams'),
    tooltip_streams: T('Allows multiple \
 <a href="http://www.ntfs.com/ntfs-multiple.htm" target"_blank">NTFS data streams</a>. \
 Disabling this option causes MacOS to write streams to files on the filesystem.'),

    placeholder_durablehandle: T('Enable SMB2/3 Durable Handles'),
    tooltip_durablehandle: T('Allow using open file handles that can withstand short disconnections. \
 Support for POSIX byte-range locks in Samba is also disabled. This option is not recommended when \
 configuring multi-protocol or local access to files.'),

    placeholder_fsrvp: T('Enable FSRVP'),
    tooltip_fsrvp: T('Enable support for the File Server Remote VSS Protocol \
 (<a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-fsrvp" target="_blank">FSVRP</a>). \
 This protocol allows RPC clients to manage snapshots for a specific SMB share. \
 The share path must be a dataset mountpoint. Snapshots have the prefix \
 <code>fss-</code> followed by a snapshot creation timestamp. A snapshot must have \
 this prefix for an RPC user to delete it.'),

    placeholder_path_suffix: T('Path Suffix'),
    tooltip_path_suffix: T('Appends a suffix to the share connection path. \
 This is used to provide unique shares on a per-user, per-computer, or per-IP address basis. \
 Suffixes can contain a macro. See \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf" target="_blank">smb.conf(5)</a> for\
 a list of supported macros. The connectpath **must** be preset before a client connects.'),

    actions_basic_mode: T('Basic Mode'),
    actions_advanced_mode: T('Advanced Mode'),

    action_share_acl: T('Edit Share ACL'),
    action_edit_acl: T('Edit Filesystem ACL'),
    action_edit_acl_dialog: {
      title: T('Error'),
      message1: T('The pool containing'),
      message2: T('is locked.')
   },
    

    dialog_warning: T('Warning'),
    dialog_warning_message: T("Setting default permissions will reset the permissions of this share and any others within its path."),

    dialog_edit_acl_title: T("Configure ACL"),
    dialog_edit_acl_message: T("Configure permissions for this share's dataset now?"),
    dialog_edit_acl_button: T("Configure now"),
    
    restart_smb_dialog: {
       title: T('Restart SMB Service?'),
       message_time_machine: T('Enabling <em>Time Machine</em> on an SMB share requires restarting the SMB service.'),
       message_allow_deny: T('Changes to <em>Hosts Allow</em> or <em>Hosts Deny</em> take effect when the \
 SMB service restarts.'),
       action_btn: T('Save and Restart SMB Now'),
       cancel_btn: T('Save Without Restarting')
    },
    restarted_smb_dialog: {
       title: T('SMB Service'),
       message: T('The SMB service has been restarted.')
    },

    // share acl
    share_acl_basic: T('Basic'),
    share_acl_entries: T('ACL Entries'),

    share_name_placeholder: T('Share Name'),
    share_name_tooltip: T('Name that was created with the SMB share.'),

    ae_who_sid_placeholder: T('SID'),
    ae_who_sid_tooltip: T('Who this ACL entry applies to, shown as a\
 <a href="https://docs.microsoft.com/en-us/windows/win32/secauthz/security-identifiers" target="_blank">Windows\
 Security Identifier</a>. Either a <i>SID</i> or a <i>Domain</i> and <i>Name</i> is required for this ACL.'),

    ae_who_name_domain_placeholder: T('Domain'),
    ae_who_name_domain_tooltip: T('Domain for the user <i>Name</i>. Required when a <i>SID</i> is not entered.\
 Local users have the SMB server NetBIOS name: <code>freenas\\smbusers</code>.'),

    ae_who_name_name_placeholder: T('Name'),
    ae_who_name_name_tooltip: T('Who this ACL entry applies to, shown as a user name. Requires adding the user <i>Domain</i>.'),

    ae_perm_placeholder: T('Permission'),
    ae_perm_tooltip: T('Predefined permission combinations:<br><i>Read</i>:\
 Read access and Execute permission on the object (RX).<br><i>Change</i>: Read\
 access, Execute permission, Write access, and Delete object (RXWD).<br><i>Full</i>:\
 Read access, Execute permission, Write access, Delete object, change Permissions, and take Ownership (RXWDPO).<br><br>\
 For more details, see <a href="https://www.samba.org/samba/docs/current/man-html/smbcacls.1.html" target="_blank">smbacls(1)</a>.'),

    ae_type_placeholder: T('Type'),
    ae_type_tooltip: T('How permissions are applied to the share.\
 <i>Allowed</i> denies all permissions by default except those that are manually defined.\
 <i>Denied</i> allows all permissions by default except those that are manually defined.'),

};
