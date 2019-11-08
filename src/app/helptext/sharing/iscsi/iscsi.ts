import { T } from "app/translate-marker";
import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import globalHelptext from '../../../helptext/global-helptext';

export const helptext_sharing_iscsi = {
  target_form_placeholder_name: T("Target Name"),
  target_form_tooltip_name: T(
    'The base name is automatically prepended if the target\
 name does not start with <i>iqn</i>. Lowercase alphanumeric\
 characters plus dot (.), dash (-), and colon (:) are allowed.\
 See the <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.'
  ),
  target_form_validators_name: [Validators.required],

  target_form_placeholder_alias: T("Target Alias"),
  target_form_tooltip_alias: T("Optional user-friendly name."),

  target_form_placeholder_mode: T("Target Mode"),
  target_form_tooltip_mode: T("Define the target as *iSCSI*,\
 *Fibre Channel*, or *Both*."),

  target_form_placeholder_portal: T("Portal Group ID"),
  target_form_tooltip_portal: T(
    "Leave empty or select number of existing portal to use."
  ),
  target_form_validators_portal: [Validators.required],

  target_form_placeholder_initiator: T("Initiator Group ID"),
  target_form_tooltip_initiator: T(
    "Select which existing initiator group\
 has access to the target."
  ),

  target_form_placeholder_authmethod: T("Auth Method"),
  target_form_tooltip_authmethod: T(
    "Choices are <i>None, Auto, CHAP,</i> or <i>Mutual CHAP</i>."
  ),

  target_form_placeholder_auth: T("Authentication Group number"),
  target_form_tooltip_auth: T(
    "Select <i>None</i> or an integer. This value\
 represents the number of existing authorized accesses."
  ),

  target_form_placeholder_delete: T("Delete"),

  portal_form_placeholder_comment: T("Description"),
  portal_form_tooltip_comment: T(
    "Optional description. Portals are automatically assigned a numeric\
 group."
  ),

  portal_form_placeholder_discovery_authmethod: T("Discovery Auth Method"),
  portal_form_tooltip_discovery_authmethod: T(
    '<a href="--docurl--/sharing.html#block-iscsi"\
 target="_blank">iSCSI</a> supports multiple\
 authentication methods that are used by the target to\
 discover valid devices. <i>None</i> allows anonymous\
 discovery while <i>CHAP</i> and <i>Mutual CHAP</i>\
 require authentication.'
  ),

  portal_form_placeholder_discovery_authgroup: T("Discovery Auth Group"),
  portal_form_tooltip_discovery_authgroup: T(
    "Select a Group ID created in <b>Authorized Access</b> if the\
 <b>Discovery Auth Method</b> is set to <i>CHAP</i> or\
 <i>Mutual CHAP</i>."
  ),

  portal_form_placeholder_ip: T("IP Address"),
  portal_form_tooltip_ip: T(
    "Select the IP address associated with an interface\
 or the wildcard address of <i>0.0.0.0</i> (any interface)."
  ),
  portal_form_validators_ip: [Validators.required],

  portal_form_placeholder_port: T("Port"),
  portal_form_tooltip_port: T(
    "TCP port used to access the iSCSI target.\
 Default is <i>3260</i>."
  ),
  portal_form_validators_port: [Validators.required],

  portal_form_placeholder_delete: T("Delete"),

  initiator_form_tooltip_connected_initiators: T(
	'Initiators currently connected to the system. Shown in IQN\
 format with an IP address. Set initiators and click an <b>-></b>\
 (arrow) to add the initiators to either the <i>Allowed Initiators</i>\
 or <i>Authorized Networks</i> lists. Clicking <i>Refresh</i> updates\
 the <i>Connected Initiators</i> list.'
  ),

  all_placeholder_initiators: T("Allow All Initiators"),

  initiator_form_placeholder_initiators: T("Allowed Initiators (IQN)"),
  initiator_form_tooltip_initiators: T(
    'Initiators allowed access to this system. Enter an\
 <a href="https://tools.ietf.org/html/rfc3720#section-3.2.6"\
 target="_blank">iSCSI Qualified Name (IQN)</a> and click <i>+</i> to\
 add it to the list. Example:\
 <i>iqn.1994-09.org.freebsd:freenas.local</i>'
  ),

  initiator_form_placeholder_auth_network: T("Authorized Networks"),
  initiator_form_tooltip_auth_network: T(
    'Network addresses allowed use this initiator. Each address can\
 include an optional\
 <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing"\
 target="_blank">CIDR</a> netmask. Click <i>+</i> to add the network\
 address to the list. Example: <i>192.168.2.0/24</i>.'
  ),

  initiator_form_placeholder_comment: T("Description"),
  initiator_form_tooltip_comment: T("Any notes about initiators."),

  globalconf_placeholder_basename: T("Base Name"),
  globalconf_tooltip_basename: T(
    'Lowercase alphanumeric characters plus dot (.), dash (-),\
 and colon (:) are allowed. See the\
 <i>Constructing iSCSI names using the iqn.format</i>\
 section of <a href="https://tools.ietf.org/html/rfc3721.html"\
 target="_blank">RFC3721</a>.'
  ),
  globalconf_validators_basename: [Validators.required],

  globalconf_placeholder_isns_servers: T("ISNS Servers"),
  globalconf_tooltip_isns_servers: T(
    "Hostnames or IP addresses of the\
 ISNS servers to be registered with the\
 iSCSI targets and portals of the system.\
 Separate each entry with a space."
  ),

  globalconf_placeholder_pool_avail_threshold: T(
    "Pool Available Space Threshold (%)"
  ),
  globalconf_tooltip_pool_avail_threshold: T(
    'Enter the percentage of free space to remain\
 in the pool. When this percentage is reached,\
 the system issues an alert, but only if zvols are used.\
 See <a href="--docurl--/vaai.html#vaai"\
 target="_blank">VAAI Threshold Warning</a> for more\
 information.'
  ),

  globalconf_placeholder_alua: T('Enable iSCSI ALUA'),
  globalconf_tooltip_alua: T(`Allow initiator to discover paths to both\
 ${globalHelptext.ctrlrs} on the target and increase storage traffic\
 efficiency. Requires ALUA-capable, High Availability (HA) hardware.`),

  globalconf_dialog_title: T("Enable service"),
  globalconf_dialog_message: T("Enable this service?"),
  globalconf_dialog_button: T("Enable Service"),

  globalconf_start_service_dialog: {
    title: T('Service started'),
    content: T('iSCSI service started'),
  },

  extent_placeholder_name: T("Extent name"),
  extent_tooltip_name: T(
    "Name of the extent. If the <i>Extent size</i> is not <i>0</i>,\
 it cannot be an existing file within the pool or dataset."
  ),
  extent_validators_name: [Validators.required],

  extent_placeholder_type: T("Extent type"),
  extent_tooltip_type: T(
    "<i>File</i> shares the contents of an individual file.\
 <i>Device</i> shares an entire device."),

  extent_placeholder_disk: T("Device"),
  extent_tooltip_disk: T(
    "Only appears if <i>Device</i> is selected. Select the\
 unformatted disk, controller, or zvol snapshot."
  ),
  extent_validators_disk: [Validators.required],

  extent_placeholder_serial: T("Serial"),
  extent_tooltip_serial: T(
    "Unique LUN ID. The default is generated from\
 the MAC address of the system."
  ),

  extent_placeholder_path: T("Path to the extent"),
  extent_tooltip_path: T(
    "Browse to an existing file. Create a new file by browsing to a\
 dataset and appending the file name to the path. Extents cannot be\
 created inside a jail root directory."
  ),
  extent_validators_path: [Validators.required],

  extent_placeholder_filesize: T("Extent size"),
  extent_tooltip_filesize: T(
    "Entering <i>0</i> uses the actual file size and requires that the\
 file already exists. Otherwise, specify the file size for the new file."
  ),
  extent_validators_filesize: [Validators.required],

  extent_placeholder_blocksize: T("Logical block size"),
  extent_tooltip_blocksize: T(
    "Leave at the default of 512 unless the initiator\
 requires a different block size."
  ),

  extent_placeholder_pblocksize: T("Disable physical block size reporting"),
  extent_tooltip_pblocksize: T(
    "Set if the initiator does not support physical block size values\
 over 4K (MS SQL)."
  ),

  extent_placeholder_avail_threshold: T("Available space threshold (%)"),
  extent_tooltip_avail_threshold: T(
    'Only appears if a <i>File</i> or zvol is selected. When\
 the specified percentage of free space is reached,\
 the system issues an alert.\
 See <a href="--docurl--/vaai.html#vaai"\
 target="_blank">VAAI</a> Threshold Warning.'
  ),

  extent_placeholder_comment: T("Description"),
  extent_tooltip_comment: T("Notes about this extent."),

  extent_placeholder_insecure_tpc: T("Enable TPC"),
  extent_tooltip_insecure_tpc: T(
    'Set to allow an initiator to bypass normal access\
 control and access any scannable target. This allows\
 <a\
 href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc771254(v=ws.11)"\
 target="_blank">xcopy</a> operations which are\
 otherwise blocked by access control.'
  ),

  extent_placeholder_xen: T("Xen initiator compat mode"),
  extent_tooltip_xen: T("Set when using Xen as the iSCSI initiator."),

  extent_placeholder_rpm: T("LUN RPM"),
  extent_tooltip_rpm: T(
    "Do <b>NOT</b> change this setting when using Windows\
 as the initiator. Only needs to be changed in large\
 environments where the number of systems using a\
 specific RPM is needed for accurate reporting\
 statistics."
  ),

  extent_placeholder_ro: T("Read-only"),
  extent_tooltip_ro: T(
    "Set to prevent the initiator from initializing this\
 LUN."
  ),

  authaccess_placeholder_tag: T("Group ID"),
  authaccess_tooltip_tag: T(
    "Allow different groups to be configured\
 with different authentication profiles.\
 Example: all users with a group ID of\
 <i>1</i> will inherit the authentication profile\
 associated with Group <i>1</i>."
  ),

  authaccess_placeholder_user: T("User"),
  authaccess_tooltip_user: T(
    "User account to create for CHAP authentication with the user on the\
 remote system. Many initiators use the initiator name as the user name."
  ),

  authaccess_placeholder_secret: T("Secret"),
  authaccess_tooltip_secret: T(
    "User password. Must be at least 12 and no more than 16 characters\
 long."
  ),

  authaccess_placeholder_secret_confirm: T("Secret (Confirm)"),

  authaccess_placeholder_peeruser: T("Peer User"),
  authaccess_tooltip_peeruser: T(
    "Only entered when configuring mutual CHAP. Usually the same value\
 as <i>User</i>."
  ),

  authaccess_placeholder_peersecret: T("Peer Secret"),
  authaccess_tooltip_peersecret: T(
    "Mutual secret password. Required when Peer User is set. Must be\
 different than the <i>Secret</i>."
  ),
  authaccess_error_peersecret: T('Must match Peer Secret (Confirm) and be\
 between 12 and 16 characters in length. Cannot be the same as\
 Secret.'),

  authaccess_placeholder_peersecret_confirm: T("Peer Secret (Confirm)"),

  associated_target_placeholder_target: T("Target"),
  associated_target_tooltip_target: T("Select an existing target."),
  associated_target_validators_target: [Validators.required],

  associated_target_placeholder_lunid: T("LUN ID"),
  associated_target_tooltip_lunid: T(
    "Select the value or enter a value between\
 <i>0</i> and <i>1023</i>. Some initiators\
 expect a value below <i>256</i>. Leave\
 this field blank to automatically assign\
 the next available ID."
  ),
  associated_target_validators_lunid: [
    Validators.min(0),
    Validators.max(1023),
    Validators.pattern(/^(0|[1-9]\d*)$/)
  ],

  associated_target_placeholder_extent: T("Extent"),
  associated_target_tooltip_extent: T("Select an existing extent."),
  associated_target_validators_extent: [Validators.required],

  fc_mode_placeholder: T('Mode'),
  fc_mode_tooltip: T(''),

  fc_target_placeholder: T('Targets'),
  fc_target_tooltip: T(''),

  fc_initiators_placeholder: T('Connected Initiators'),
  fc_initiators_tooltip: T(''),
};
