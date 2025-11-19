import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSharingSmb = {
  rootLevelWarning: T(
    'Configuring SMB exports of root-level datasets\
 may lead to storage reconfiguration issues.\
 Consider creating a dataset instead.',
  ),

  shareAclDescription: T('The SMB share ACL defines access rights for users of this SMB share up to, but not beyond, the access granted by filesystem ACLs.'),

  pathLabel: T('Path'),
  pathTooltip: T('Select pool, dataset, or directory to share.'),
  nameLabel: T('Name'),

  commentLabel: T('Description'),

  enabledLabel: T('Enabled'),
  auditLogTooltip: T(
    'Controls whether audit messages will be generated for the share. \
<br><br> <b>Note</b>: Auditing may not be enabled if SMB1 support is enabled for the server.',
  ),
  watchListTooltip: T(
    'List of groups for which to generate audit messages.',
  ),
  ignoreListTooltip: T(
    'List of groups to ignore when auditing. If conflict arises between Watch List and Ignore List \
 (based on user group membership), then Watch List will take precedence and ops will be audited.',
  ),

  homeLabel: T('Use as Home Share'),
  homeTooltip: T(
    'Legacy feature. <br><br>Allows the share to host user home \
 directories. Each user is given a personal home directory when \
 connecting to the share which is not accessible by other users. This \
 allows for a personal, dynamic share. Only one share can be used \
 as the home share.',
  ),

  purposeLabel: T('Purpose'),
  purposeTooltip: T(
    'Select a preset configuration for the share. This\
 applies predetermined values and disables changing some share options.',
  ),

  timemachineLabel: T('Time Machine'),
  timemachineTooltip: T('Enable Time Machine backups on this share.'),

  timemachineQuotaLabel: T('Time Machine Quota'),
  timemachineQuotaTooltip: T('Number of bytes'),

  autoDatasetCreationLabel: T('Auto Dataset Creation'),
  autoDatasetCreationTooltip: T('Create dataset automatically if it does not exist.'),
  datasetNamingSchemaLabel: T('Dataset Naming Schema'),
  datasetNamingSchemaTooltip: T('The naming schema to use when Auto Dataset Creation is specified.\
 If you do not set a schema, the server uses %u (username) if it is not joined to Active Directory.\
 If the server is joined to Active Directory it uses %D/%u (domain/username).'),
  autoQuotaLabel: T('Auto Quota'),
  autoQuotaTooltip: T('Set the specified ZFS quota (in gibibytes) on new datasets.\
 If the value is zero, TrueNAS disables automatic quotas for the share.'),

  afpLabel: T('Legacy AFP Compatibility'),
  afpTooltip: T(
    'This controls how the SMB share reads and writes data. Leave unset for the share to behave like a normal SMB share and set for the share to behave like the deprecated Apple Filing Protocol (AFP). This should only be set when this share originated as an AFP sharing configuration. This is not required for pure SMB shares or MacOS SMB clients.',
  ),
  afpWarningTitle: T('Warning'),
  afpWarningMessage: T(
    'This option controls how metadata and alternate data streams read write to disks. Only enable this when the share configuration was migrated from the deprecated Apple Filing Protocol (AFP). Do not attempt to force a previous AFP share to behave like a pure SMB share or file corruption can occur.',
  ),
  afpDialogButton: T('I understand'),

  aclLabel: T('Enable ACL'),
  aclTooltip: T('Enable ACL support for the SMB share.'),

  readOnlyLabel: T('Export Read Only'),
  readOnlyTooltip: T('Prohibits writes to this share.'),

  browsableLabel: T('Browsable to Network Clients'),
  browsableTooltip: T(
    'Determine whether this share name is included\
 when browsing shares. Home shares are only visible to the owner\
 regardless of this setting.',
  ),

  recyclebinLabel: T('Export Recycle Bin'),
  recyclebinTooltip: T('Select to enable. Deleted files from the same \
    dataset move to a <b>Recycle Bin</b> in that dataset and do not take any \
    additional space. Recycle bin is for access over SMB protocol only.\
    The files are renamed to a per-user subdirectory within \
    <b><i>.recycle</i></b> directory at either (1) root of SMB share \
    (if path is same dataset as SMB share) or (2) at root of current \
    dataset if we have nested datasets. Because of (2) there is no \
    automatic deletion based on file size.'),

  guestokLabel: T('Allow Guest Access'),
  guestokTooltip: T(
    'Legacy feature. <br><br>Privileges are the same as the guest account. \
 Guest access is disabled by default in Windows 10 version 1709 and \
 Windows Server version 1903. Additional client-side configuration is \
 required to provide guest access to these clients.<br><br> \
 <i>MacOS clients:</i> Attempting to connect as a user that does not \
 exist in TrueNAS <i>does not</i> automatically connect as the guest \
 account. The <b>Connect As:</b> <i>Guest</i> option must be \
 specifically chosen in MacOS to log in as the guest account. See the \
 <a href="https://support.apple.com/guide/mac-help/connect-mac-shared-computers-servers-mchlp1140/" target="_blank">Apple documentation</a> \
 for more details.',
  ),

  abeLabel: T('Access Based Share Enumeration'),
  abeTooltip: T(
    'Restrict share visibility to users with read or write access\
 to the share. See the <a href="https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html"\
 target=_blank>smb.conf</a> manual page.',
  ),

  hostsallowLabel: T('Hosts Allow'),
  hostsAllowTooltip: T('Enter a list of allowed hostnames or IP addresses.\
    Separate entries by pressing <code>Enter</code>. A more detailed description \
    with examples can be found \
    <a href="https://wiki.samba.org/index.php/1.4_Samba_Security" target="_blank">here</a>. <br><br> \
    If neither *Hosts Allow* or *Hosts Deny* contains \
    an entry, then SMB share access is allowed for any host. <br><br> \
    If there is a *Hosts Allow* list but no *Hosts Deny* list, then only allow \
    hosts on the *Hosts Allow* list. <br><br> \
    If there is a *Hosts Deny* list but no *Hosts Allow* list, then allow all \
    hosts that are not on the *Hosts Deny* list. <br><br> \
    If there is both a *Hosts Allow* and *Hosts Deny* list, then allow all hosts \
    that are on the *Hosts Allow* list. <br><br> \
    If there is a host not on the *Hosts Allow* and not on the *Hosts Deny* list, \
    then allow it.'),
  hostsdenyLabel: T('Hosts Deny'),
  hostsdenyTooltip: T(
    'Enter a list of denied hostnames or IP addresses.\
 Separate entries by pressing <code>Enter</code>. \
 If neither *Hosts Allow* or *Hosts Deny* contains \
 an entry, then SMB share access is allowed for any host. <br><br> \
 If there is a *Hosts Allow* list but no *Hosts Deny* list, then only allow \
 hosts on the *Hosts Allow* list. <br><br> \
 If there is a *Hosts Deny* list but no *Hosts Allow* list, then allow all \
 hosts that are not on the *Hosts Deny* list. <br><br> \
 If there is both a *Hosts Allow* and *Hosts Deny* list, then allow all hosts \
 that are on the *Hosts Allow* list. <br><br> \
 If there is a host not on the *Hosts Allow* and not on the *Hosts Deny* list, \
 then allow it.',
  ),

  shadowcopyLabel: T('Enable Shadow Copies'),
  shadowcopyTooltip: T(
    'Export ZFS snapshots as\
 <a href="https://docs.microsoft.com/en-us/windows/desktop/vss/shadow-copies-and-shadow-copy-sets"\
 target=_blank>Shadow Copies</a> for VSS clients.',
  ),

  aaplNameManglingLabel: T('Use Apple-style Character Encoding'),
  aaplNameManglingTooltip: T(
    'By default, Samba uses a hashing algorithm for NTFS illegal \
 characters. Enabling this option translates NTFS illegal characters to the Unicode private range.',
  ),

  streamsLabel: T('Enable Alternate Data Streams'),
  streamsTooltip: T(
    'Allows multiple \
 <a href="http://www.ntfs.com/ntfs-multiple.htm">NTFS data streams</a>. \
 Disabling this option causes macOS to write streams to files on the filesystem.',
  ),

  durablehandleLabel: T('Enable SMB2/3 Durable Handles'),
  durablehandleTooltip: T(
    'Allow using open file handles that can withstand short disconnections. \
 Support for POSIX byte-range locks in Samba is also disabled. This option is not recommended when \
 configuring multi-protocol or local access to files.',
  ),

  fsrvpLabel: T('Enable FSRVP'),
  fsrvpTooltip: T(
    'Enable support for the File Server Remote VSS Protocol \
 (<a href="https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-fsrvp" target="_blank">FSRVP</a>). \
 This protocol allows RPC clients to manage snapshots for a specific SMB share. \
 The share path must be a dataset mountpoint. Snapshots have the prefix \
 <code>fss-</code> followed by a snapshot creation timestamp. A snapshot must have \
 this prefix for an RPC user to delete it.',
  ),

  pathSuffixLabel: T('Path Suffix'),
  pathSuffixTooltip: T(
    'Appends a suffix to the share connection path. \
 This is used to provide unique shares on a per-user, per-computer, or per-IP address basis. \
 Suffixes can contain a macro. See the \
 <a href="https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html" target="_blank">smb.conf</a> manual page for \
 a list of supported macros. The connectpath **must** be preset before a client connects.',
  ),

  auxsmbconfLabel: T('Additional Parameters String'),
  auxsmbconfTooltip: T('String of additional smb4.conf parameters not covered by the system\'s API.'),

  restartedSmbDialog: {
    title: T('SMB Service'),
    message: T('The SMB service has been restarted.'),
  },

  aePermTooltip: T(
    'Predefined permission combinations:<br><i>Read</i>:\
 Read access and Execute permission on the object (RX).<br><i>Change</i>: Read\
 access, Execute permission, Write access, and Delete object (RXWD).<br><i>Full</i>:\
 Read access, Execute permission, Write access, Delete object, change Permissions, and take Ownership (RXWDPO).<br><br>\
 For more details, see <a href="https://www.samba.org/samba/docs/current/man-html/smbcacls.1.html" target="_blank">smbacls(1)</a>.',
  ),
  aeTypeTooltip: T(
    'How permissions are applied to the share.\
 <i>Allowed</i> denies all permissions by default except those that are manually defined.\
 <i>Denied</i> allows all permissions by default except those that are manually defined.',
  ),

  formTitleAdd: T('Add SMB'),
  formTitleEdit: T('Edit SMB'),

  stripACLDialog: {
    title: T('Warning'),
    message: T(
      'An ACL is detected on the selected path but <i>Enable ACL</i> is not selected for this share. \
 ACLs should be stripped from the dataset prior to creating an SMB share.',
    ),
    button: T('Continue'),
  },

  manglingDialog: {
    title: T('Warning'),
    message: T(
      'The <i>Use Apple-style character encoding</i> value has changed. \
 This parameter affects how file names are read from and written to storage. Changes to \
 this parameter after data is written can prevent accessing or deleting files containing \
 mangled characters.',
    ),
    action: T('I Understand'),
  },

  restartPt1: T(
    'The following changes to this SMB Share require the SMB Service to be restarted before they can take effect.',
  ),
  restartPt2: T('Would you like to restart the SMB Service?'),
};
