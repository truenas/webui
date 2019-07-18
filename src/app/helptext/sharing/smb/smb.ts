import { T } from "app/translate-marker";
import { Validators } from "@angular/forms";

export const helptext_sharing_smb = {
    column_name: T('Name'),
    column_path: T('Path'),

    placeholder_path: T('Path'),
    tooltip_path: T('Select pool, dataset, or directory to share.'),
    validators_path: [ Validators.required ],

    placeholder_name: T('Name'),
    tooltip_name: T('Enter a name for the share.'),
    errormsg_name: T("<i>global</i> is a reserved name that cannot be used as a share\
 name. Please enter a different share name."),

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
    tooltip_recyclebin: T('When set, deleted files are moved to a hidden\
 <b>.recycle</b> in the root folder of the share.\
 The <b>.recycle</b> directory can be\
 deleted to reclaim space and is automatically\
 recreated when a file is deleted.'),

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
 href="%%docurl%%/sharing.html#avail-vfs-modules-tab"\
 target="blank">virtual file system modules</a> to\
 enhance functionality.'),

    placeholder_storage_task: T('Periodic Snapshot Task'),
    tooltip_storage_task: T('Used to configure directory shadow copies on a\
 per-share basis. Select the pre-configured periodic\
 snapshot task to use for the shadow copies of this\
 share. Periodic snapshots must be recursive.'),

    placeholder_auxsmbconf: T('Auxiliary Parameters'),
    tooltip_auxsmbconf: T('Additional <b>smb5.conf</b> parameters not covered by\
 other option fields.'),

    actions_basic_mode: T('Basic Mode'),
    actions_advanced_mode: T('Advanced Mode'),

    dialog_enable_service_title: T("Enable service"),
    dialog_enable_service_message: T("Enable this service?"),
    dialog_enable_service_button: T("Enable Service"),
    dialog_warning: T('Warning'),
    dialog_warning_message: T("Setting default permissions will reset the permissions of this share and any others within its path."),
    
    snackbar_close: T('close'),
    snackbar_service_started: T("Service started")
};
