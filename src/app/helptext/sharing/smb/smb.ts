import { T } from "app/translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_smb = {
    column_name: T('Name'),
    column_path: T('Path'),
    column_comment: T('Description'),

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

    placeholder_home: T('Use as home share'),
    tooltip_home: T('Set to allow this share to hold user home\
 directories. Only one share can be\
 the home share.\
 Note: Lower case names for user home\
 directories are strongly recommended, as Samba\
 maps usernames to all lower case. For example, the\
 username John will be mapped to a home directory\
 named john. If the <i>Path</i> to the home share\
 includes an upper case username, delete the existing user\
 and recreate it in <i>Accounts --> Users</i>\
 with an all lower case <i>Username</i>. Return\
 to <i>Sharing --> SMB</i> to create the home share,\
 and select the </i>Path</i> that contains the new\
 lower case username.'),

   placeholder_timemachine: T('Time Machine'),
   tooltip_timemachine: T('Enable Time Machine backups on this share.'),

    placeholder_default_permissions: T('Default Permissions'),
    tooltip_default_permissions: T('When enabled, the ACLs grant read and write access for\
 owner or group and read-only for others.\
 <b>Only</b> leave unset when creating a share on a\
 system that already has custom\
 ACLs configured.'),

    placeholder_ro: T('Export Read Only'),
    tooltip_ro: T('Set to prohibit writes to this share'),

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

    placeholder_showhiddenfiles: T('Show Hidden Files'),
    tooltip_showhiddenfiles: T('Set to disable the Windows <i>hidden</i> attribute\
 on a new Unix hidden file. Unix hidden filenames start\
 with a dot: <b>.foo</b>.\
 Existing files are not affected.'),

    placeholder_guestok: T('Allow Guest Access'),
    tooltip_guestok: T('Privileges are the same as the guest account.\
 Guest access is disabled by default in Windows 10 version 1709 and\
 Windows Server version 1903. Additional client-side configuration is\
 required to provide guest access to these clients.'),

    placeholer_guestonly: T('Only Allow Guest Access'),
    tooltip_guestonly: T('Requires <b>Allow guest access</b> to also be set.\
 Forces guest access for all connections.'),

    placeholder_abe: T('Access Based Share Enumeration'),
    tooltip_abe: T('Restrict share visibility to users with read or write access\
 to the share. See <a href="https://www.freebsd.org/cgi/man.cgi?query=smb.conf"\
 target=_blank>smb.conf(5)</a>.'),

    placeholder_hostsallow: T('Hosts Allow'),
    tooltip_hostsallow: T('Enter a list of allowed hostnames or IP addresses.\
 Separate entries with a comma, space, or tab.'),

    placeholder_hostsdeny: T('Hosts Deny'),
    tooltip_hostsdeny: T('Enter a list of denied hostnames or IP addresses.\
 Separate entries with a comma, space, or tab.'),

    placeholder_vfsobjects: T('VFS Objects'),
    tooltip_vfsobjects: T('Adds <a\
 href="--docurl--/sharing.html#avail-vfs-modules-tab"\
 target="blank">virtual file system modules</a> to\
 enhance functionality.'),

    placeholder_shadowcopy: T('Enable Shadow Copies'),
    tooltip_shadowcopy: T('Export ZFS snapshots as\
 <a href="https://docs.microsoft.com/en-us/windows/desktop/vss/shadow-copies-and-shadow-copy-sets"\
 target=_blank>Shadow Copies</a> for VSS clients.'),

    placeholder_auxsmbconf: T('Auxiliary Parameters'),
    tooltip_auxsmbconf: T('Additional <b>smb5.conf</b> parameters not covered by\
 other option fields.'),

    actions_basic_mode: T('Basic Mode'),
    actions_advanced_mode: T('Advanced Mode'),

    action_edit_acl: T('Edit ACL'),

    dialog_enable_service_title: T("Enable service"),
    dialog_enable_service_message: T("Enable this service?"),
    dialog_enable_service_button: T("Enable Service"),
    dialog_warning: T('Warning'),
    dialog_warning_message: T("Setting default permissions will reset the permissions of this share and any others within its path."),

    dialog_edit_acl_title: T("Configure ACL"),
    dialog_edit_acl_message: T("Configure permissions for this share's dataset now?"),
    dialog_edit_acl_button: T("Configure now"),
    
    snackbar_close: T('close'),
    snackbar_service_started: T("Service started"),

    restart_smb_dialog: {
       title: T('Restart SMB Service?'),
       message: T('Enabling <em>Time Machine</em> on an SMB share requires a restart of the SMB service.'),
       action_btn: T('Save and Restart SMB Now'),
       cancel_btn: T('Save Without Restarting')
    },
    restart_smb_snackbar: {
       message: T('SMB service has been restarted'),
       action: T('Close')
    }
};
