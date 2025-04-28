import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { IscsiAuthMethod, IscsiExtentType } from 'app/enums/iscsi.enum';
import { Option } from 'app/interfaces/option.interface';

export const helptextIscsi = {
  basicInfo: T('Basic Info'),
  targetGroup: T('iSCSI Group'),

  target: {
    nameLabel: T('Target Name'),
    nameTooltip: T(
      'The base name is automatically prepended if the target\
 name does not start with <i>iqn</i>. Lowercase alphanumeric\
 characters plus dot (.), dash (-), and colon (:) are allowed.\
 See the <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.',
    ),

    aliasLabel: T('Target Alias'),
    aliasTooltip: T('Optional user-friendly name.'),

    portalGroupIdLabel: T('Portal Group ID'),
    portalGroupIdTooltip: T(
      'Leave empty or select number of existing portal to use.',
    ),

    initiatorGroupIdLabel: T('Initiator Group ID'),
    initiatorGrouIpIdTooltip: T(
      'Select which existing initiator group\
 has access to the target.',
    ),

    authenticationMethodLabel: T('Authentication Method'),
    authenticationMethodOptions: [{
      label: T('None'),
      value: IscsiAuthMethod.None,
    }, {
      label: 'CHAP',
      value: IscsiAuthMethod.Chap,
    }, {
      label: 'Mutual CHAP',
      value: IscsiAuthMethod.ChapMutual,
    }],

    authGroupNumberLabel: T('Authentication Group Number'),
    authGroupNumberTooltip: T(
      'Select <i>None</i> or an integer. This value\
 represents the number of existing authorized accesses.',
    ),
  },

  portal: {
    descriptionLabel: T('Description'),

    discoveryAuthMethodTooltip: T('iSCSI supports multiple \
 authentication methods that are used by the target to discover valid \
 devices. <i>None</i> allows anonymous discovery while <i>CHAP</i> and \
 <i>Mutual CHAP</i> require authentication.'),

    ipLabel: T('IP Address'),
    ipTooltip: T('Select the IP addresses to be listened on \
 by the portal. Click ADD to add IP addresses with a different network \
 port. The address <i>0.0.0.0</i> can be selected to listen on all IPv4 \
 addresses, or <i>::</i> to listen on all IPv6 addresses.'),

    portLabel: T('Port'),
    portTooltip: T(
      'TCP port used to access the iSCSI target.\
 Default is <i>3260</i>.',
    ),
  },

  initiator: {
    allowAllLabel: T('Allow All Initiators'),

    addIqnLabel: T('Add Allowed Initiators (IQN)'),
    initiatorsTooltip: T(
      'Initiators allowed access to this system. Enter an\
 <a href="https://tools.ietf.org/html/rfc3720#section-3.2.6"\
 target="_blank">iSCSI Qualified Name (IQN)</a> and click <i>+</i> to\
 add it to the list. Example:\
 <i>iqn.1994-09.org.freebsd:freenas.local</i>',
    ),
    descriptionLabel: T('Description'),
  },

  config: {
    basenameTooltip: T(
      'Lowercase alphanumeric characters plus dot (.), dash (-),\
 and colon (:) are allowed. See the\
 <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.',
    ),

    isnsServersTooltip: T('Hostnames or IP addresses of the \
 ISNS servers to be registered with the iSCSI targets and portals of \
 the system. Separate entries by pressing <code>Enter</code>.'),

    alertThreshold: T('Generate an alert when the \
   pool has this percent space remaining. This is typically \
   configured at the pool level when using zvols or at the extent level \
   for both file and device based extents.'),

    aluaTooltip: T('Do not enable ALUA on TrueNAS unless it is also supported \
    by and enabled on the client computers. ALUA only works when enabled \
    on both the client and server.'),

    iserTooltip: T('Activates iSCSI Extensions for RDMA (iSER) in TrueNAS, enabling\
 the iSCSI protocol to directly transfer data into and out of SCSI memory buffers for improved\
 performance. Enabling is limited to TrueNAS Enterprise-licensed systems and requires the system\
 and network environment have Remote Direct Memory Access (RDMA)-capable hardware.'),
  },

  fieldset_extent_basic: T('Basic Info'),
  fieldset_extent_type: T('Type'),
  fieldset_extent_options: T('Compatibility'),

  extent_placeholder_name: T('Name'),
  extent_tooltip_name: T(
    'Name of the extent. If the <i>Extent size</i> is not <i>0</i>,\
 it cannot be an existing file within the pool or dataset.',
  ),

  extent_placeholder_type: T('Extent Type'),
  extent_tooltip_type: T('<i>Device</i> provides virtual storage access to zvols, zvol snapshots, or physical devices.\
  <i>File</i> provides virtual storage access to a single file.'),

  extent_placeholder_disk: T('Device'),
  extent_tooltip_disk: T(
    'Only appears if <i>Device</i> is selected. Select the\
 unused zvol or zvol snapshot.',
  ),

  extent_placeholder_serial: T('Serial'),
  extent_tooltip_serial: T(
    'Unique LUN ID. The default is generated from\
 the MAC address of the system.',
  ),

  extent_placeholder_path: T('Path to the Extent'),
  extent_tooltip_path: T('Browse to an existing file. Create a new file by browsing to a\
 dataset and appending /<i>(filename.ext)</i> to the path.'),

  extent_placeholder_filesize: T('Filesize'),
  extent_tooltip_filesize: T('Entering <i>0</i> uses the actual file size and requires that the\
 file already exists. Otherwise, specify the file size for the new file.'),

  extent_placeholder_blocksize: T('Logical Block Size'),
  extent_tooltip_blocksize: T(
    'Leave at the default of 512 unless the initiator\
 requires a different block size.',
  ),

  extent_placeholder_pblocksize: T('Disable Physical Block Size Reporting'),
  extent_tooltip_pblocksize: T(
    'Set if the initiator does not support physical block size values\
 over 4K (MS SQL).',
  ),

  extent_placeholder_avail_threshold: T('Available Space Threshold (%)'),
  extent_tooltip_avail_threshold: T('Only appears if a <i>File</i> or \
 zvol is selected. When the specified percentage of free space is reached,\
 the system issues an alert.'),

  extent_placeholder_comment: T('Description'),
  extent_tooltip_comment: T('Notes about this extent.'),

  extent_placeholder_insecure_tpc: T('Enable TPC'),
  extent_tooltip_insecure_tpc: T(
    'Set to allow an initiator to bypass normal access\
 control and access any scannable target. This allows\
 <a\
 href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc771254(v=ws.11)"\
 target="_blank">xcopy</a> operations which are\
 otherwise blocked by access control.',
  ),

  extent_placeholder_xen: T('Xen initiator compat mode'),
  extent_tooltip_xen: T('Set when using Xen as the iSCSI initiator.'),

  extent_placeholder_rpm: T('LUN RPM'),
  extent_tooltip_rpm: T(
    'Do <b>NOT</b> change this setting when using Windows\
 as the initiator. Only needs to be changed in large\
 environments where the number of systems using a\
 specific RPM is needed for accurate reporting\
 statistics.',
  ),

  extent_placeholder_ro: T('Read-only'),
  extent_tooltip_ro: T(
    'Set to prevent the initiator from initializing this\
 LUN.',
  ),

  extent_placeholder_enabled: T('Enabled'),
  extent_tooltip_enabled: T('Set to enable the iSCSI extent.'),

  extent_form_enum_rpm: [
    { label: 'UNKNOWN', value: 'UNKNOWN' },
    { label: 'SSD', value: 'SSD' },
    { label: '5400', value: '5400' },
    { label: '7200', value: '7200' },
    { label: '10000', value: '10000' },
    { label: '15000', value: '15000' },
  ],

  extent_form_enum_type: [
    { label: T('Device'), value: IscsiExtentType.Disk },
    { label: T('File'), value: IscsiExtentType.File },
  ],

  extent_form_enum_blocksize: [
    { label: '512', value: 512 },
    { label: '1024', value: 1024 },
    { label: '2048', value: 2048 },
    { label: '4096', value: 4096 },
  ] as Option[],

  authaccess_tooltip_tag: T(
    'Allow different groups to be configured\
 with different authentication profiles.\
 Example: all users with a group ID of\
 <i>1</i> will inherit the authentication profile\
 associated with Group <i>1</i>.',
  ),

  authaccess_tooltip_user: T(
    'User account to create for CHAP authentication with the user on the\
 remote system. Many initiators use the initiator name as the user name.',
  ),

  authaccess_tooltip_peeruser: T(
    'Only entered when configuring mutual CHAP. Usually the same value\
 as <i>User</i>.',
  ),
  authaccess_tooltip_peersecret: T(
    'Mutual secret password. Required when Peer User is set. Must be\
 different than the <i>Secret</i>.',
  ),

  associated_target_tooltip_lunid: T(
    'Select the value or enter a value between\
 <i>0</i> and <i>1023</i>. Some initiators\
 expect a value below <i>256</i>. Leave\
 this field blank to automatically assign\
 the next available ID.',
  ),

  associated_target_tooltip_extent: T('Select an existing extent.'),

  name_placeholder: T('Name'),
  name_tooltip: T('Keep the name short and only lowercase. Using a name longer than 63 characters can prevent accessing the block device. Allowed characters: letters, numbers, period (.), dash (-), and colon (:).'),

  disk_placeholder: T('Device'),
  disk_tooltip: T('Select the unused zvol or zvol snapshot. Select\
 <i>Create New</i> to create a new zvol.'),

  dataset_placeholder: T('Pool/Dataset'),
  dataset_tooltip: T('Browse to an existing pool or dataset to store the new zvol.'),

  volsize_placeholder: T('Size'),
  volsize_tooltip: T('Specify the size of the new zvol.'),

  usefor_placeholder: T('Sharing Platform'),
  usefor_tooltip: T('Choose the platform that will use this share. The associated options are applied to this share.'),

  target_placeholder: T('Target'),
  target_tooltip: T('Create a new Target or choose an existing target for this share.'),

  portal_placeholder: T('Portal'),
  portal_tooltip: T('Select an existing portal or choose <i>Create New</i> to configure a new portal.'),

  initiators_placeholder: T('Initiators'),
  initiators_tooltip: T('Leave blank to allow all or enter a list of initiator hostnames. \
   Separate entries by pressing <code>Enter</code>.'),

  auth_network: {
    placeholder: T('Authorized Networks'),
    tooltip: T('Network addresses allowed to use this initiator. Leave blank to allow all \
     networks or list network addresses with a CIDR mask. Separate entries by pressing \
     <code>Enter</code>.'),
    error: T('Invalid network address list. Check for typos or missing CIDR netmasks and \
     separate addresses by pressing <code>Enter</code>.'),
  },
};
