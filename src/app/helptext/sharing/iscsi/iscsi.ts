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

  fieldsetExtentBasic: T('Basic Info'),
  fieldsetExtentType: T('Type'),
  fieldsetExtentOptions: T('Compatibility'),

  extent: {
    nameLabel: T('Name'),
    nameTooltip: T(
      'Name of the extent. If the <i>Extent size</i> is not <i>0</i>,\
 it cannot be an existing file within the pool or dataset.',
    ),

    typeLabel: T('Extent Type'),
    typeTooltip: T('<i>Device</i> provides virtual storage access to zvols, zvol snapshots, or physical devices.\
  <i>File</i> provides virtual storage access to a single file.'),

    deviceLabel: T('Device'),
    deviceTooltip: T(
      'Only appears if <i>Device</i> is selected. Select the\
 unused zvol or zvol snapshot.',
    ),

    serialLabel: T('Serial'),
    serialTooltip: T(
      'Unique LUN ID. The default is generated from\
 the MAC address of the system.',
    ),

    pathLabel: T('Path to the Extent'),
    pathTooltip: T('Browse to an existing file. Create a new file by browsing to a\
 dataset and appending /<i>(filename.ext)</i> to the path.'),

    filesizeLabel: T('Filesize'),
    filesizeTooltip: T('Entering <i>0</i> uses the actual file size and requires that the\
 file already exists. Otherwise, specify the file size for the new file.'),

    blocksizeLabel: T('Logical Block Size'),
    blocksizeTooltip: T(
      'Leave at the default of 512 unless the initiator\
 requires a different block size.',
    ),

    disablePhysicalBlockSizeLabel: T('Disable Physical Block Size Reporting'),
    disablePhysicalBlockSizeTooltip: T(
      'Set if the initiator does not support physical block size values\
 over 4K (MS SQL).',
    ),

    thresholdLabel: T('Available Space Threshold (%)'),
    thresholdTooltip: T('Only appears if a <i>File</i> or \
 zvol is selected. When the specified percentage of free space is reached,\
 the system issues an alert.'),

    commentLabel: T('Description'),

    tpcLabel: T('Enable TPC'),
    tpcTooltip: T(
      'Set to allow an initiator to bypass normal access\
 control and access any scannable target. This allows\
 <a\
 href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc771254(v=ws.11)"\
 target="_blank">xcopy</a> operations which are\
 otherwise blocked by access control.',
    ),

    xenLabel: T('Xen initiator compat mode'),
    xenTooltip: T('Set when using Xen as the iSCSI initiator.'),

    rpmLabel: T('LUN RPM'),
    rpmTooltip: T(
      'Do <b>NOT</b> change this setting when using Windows\
 as the initiator. Only needs to be changed in large\
 environments where the number of systems using a\
 specific RPM is needed for accurate reporting\
 statistics.',
    ),

    readOnlyLabel: T('Read-only'),
    readOnlyTooltip: T(
      'Set to prevent the initiator from initializing this\
 LUN.',
    ),

    enabledLabel: T('Enabled'),
    enabledTooltip: T('Set to enable the iSCSI extent.'),

    rpmOptions: [
      { label: 'UNKNOWN', value: 'UNKNOWN' },
      { label: 'SSD', value: 'SSD' },
      { label: '5400', value: '5400' },
      { label: '7200', value: '7200' },
      { label: '10000', value: '10000' },
      { label: '15000', value: '15000' },
    ],

    typeOptions: [
      { label: T('Device'), value: IscsiExtentType.Disk },
      { label: T('File'), value: IscsiExtentType.File },
    ],

    blocksizeOptions: [
      { label: '512', value: 512 },
      { label: '1024', value: 1024 },
      { label: '2048', value: 2048 },
      { label: '4096', value: 4096 },
    ] as Option[],
  },

  authaccess: {
    tagTooltip: T(
      'Allow different groups to be configured\
 with different authentication profiles.\
 Example: all users with a group ID of\
 <i>1</i> will inherit the authentication profile\
 associated with Group <i>1</i>.',
    ),

    userTooltip: T(
      'User account to create for CHAP authentication with the user on the\
 remote system. Many initiators use the initiator name as the user name.',
    ),

    peeruserTooltip: T(
      'Only entered when configuring mutual CHAP. Usually the same value\
 as <i>User</i>.',
    ),
    peersecretTooltip: T(
      'Mutual secret password. Required when Peer User is set. Must be\
 different than the <i>Secret</i>.',
    ),
  },

  lunidTooltip: T(
    'Select the value or enter a value between\
 <i>0</i> and <i>1023</i>. Some initiators\
 expect a value below <i>256</i>. Leave\
 this field blank to automatically assign\
 the next available ID.',
  ),

  existingExtentTooltip: T('Select an existing extent.'),

  nameLabel: T('Name'),
  nameTooltip: T('Keep the name short and only lowercase. Using a name longer than 63 characters can prevent accessing the block device. Allowed characters: letters, numbers, period (.), dash (-), and colon (:).'),

  diskName: T('Device'),
  diskTooltip: T('Select the unused zvol or zvol snapshot. Select\
 <i>Create New</i> to create a new zvol.'),

  datasetLabel: T('Pool/Dataset'),
  datasetTooltip: T('Browse to an existing pool or dataset to store the new zvol.'),

  sizeLabel: T('Size'),
  sizeTooltip: T('Specify the size of the new zvol.'),

  useforLabel: T('Sharing Platform'),
  useforTooltip: T('Choose the platform that will use this share. The associated options are applied to this share.'),

  targetLabel: T('Target'),
  targetTooltip: T('Create a new Target or choose an existing target for this share.'),

  portalLabel: T('Portal'),
  portalTooltip: T('Select an existing portal or choose <i>Create New</i> to configure a new portal.'),

  initiatorsLabel: T('Initiators'),
  initiatorsTooltip: T('Leave blank to allow all or enter a list of initiator hostnames. \
   Separate entries by pressing <code>Enter</code>.'),

  authNetwork: {
    placeholder: T('Authorized Networks'),
    tooltip: T('Network addresses allowed to use this initiator. Leave blank to allow all \
     networks or list network addresses with a CIDR mask. Separate entries by pressing \
     <code>Enter</code>.'),
    error: T('Invalid network address list. Check for typos or missing CIDR netmasks and \
     separate addresses by pressing <code>Enter</code>.'),
  },
};
