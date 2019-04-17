import { T } from '../../../translate-marker';

export default {
    step1_label: T("Create or Choose Block Device"),

    name_placeholder: T("Name"),
    name_tooltip: T("Keep the name short. Using a name longer than 63 characters can prevent accessing the block device."),

    type_placeholder: T("Type"),
    type_tooltip: T("<i>Device</i> provide virtual storage access to zvols, zvol snapshots, or physical devices.\
 <i>File</i> provides virtual storage access to an individual file."),

    file_placeholder: T("File"),
    file_tooltip: T("Browse to an existing file. Create a new file by browsing to a dataset and appending\
 /<i>{filename.ext}</i> to the path."),

    filesize_placeholder: T("Filesize"),
    filesize_tooltip: T("When the file already exists, enter a size of 0 to use the actual file size. For new files,\
 enter the size of the file to create."),

    disk_placeholder: T("Device"),
    disk_tooltip: T("Select the unformatted disk, controller, zvol, zvol snapshot, or HAST device. Select\
 <i>Create New</i> for options to create a new zvol."),

    dataset_placeholder: T("Pool/Dataset"),
    dataset_tooltip: T("Browse to an existing pool or dataset to store the new zvol."),

    volsize_placeholder: T("Size"),
    volsize_tooltip: T("Specify the size of the new zvol."),

    volblocksize_placeholder: T("Block Size"),
    volblocksize_tooltip: T("Only override the default if the initiator requires a different block size."),

    usefor_placeholder: T("What are you using this for"),
    usefor_tooltip: T("Choose the platform that will use this share. The associated options are applied to this share."),

    step2_label: T("Portal"),

    portal_placeholder: T("Portal"),
    portal_tooltip: T("Select an existing portal or choose <i>Create New</i> to configure a new portal."),

    discovery_authmethod_placeholder: T("Discovery Auth Method"),
    discovery_authmethod_tooltip: T("<a href='%%docurl%%/sharing.html%%webversion%%#block-iscsi' target='_blank'>iSCSI</a>\
 supports multiple authentication methods that are used by the target to discover valid devices. None allows anonymous\
 discovery while CHAP and Mutual CHAP require authentication."),

    discovery_authgroup_placeholder: T("Discovery Auth Group"),
    discovery_authgroup_tooltip: T("Select a user created in Authorized Access if the Discovery Auth Method is set to CHAP\
 or Mutual CHAP."),

    ip_placeholder: T("IP"),
    ip_tooltip: T("Select the IP address associated with an interface or the wildcard address of 0.0.0.0 (any interface)."),

    port_placeholder: T("Port"),
    port_tooltip: T("TCP port used to access the iSCSI target. Default is 3260."),

    auth_placeholder: T('Authorized Access'),
    auth_tooltip: T("Select an existing user configuration or <i>Create New</i> to view options for a new user configuration."),

    tag_placeholder: T("Group ID"),
    tag_tooltip: T("Allows different groups to be configured with different authentication profiles. Example: all users with\
 a group ID of 1 will inherit the authentication profile associated with Group 1."),

    user_placeholder: T("User"),
    user_tooltip: T("Enter name of user account to use for CHAP authentication with the user on the remote system. Many\
 initiators default to the initiator name as the user."),

    secret_placeholder: T("Secret"),
    secret_tooltip: T("Enter a password for the User. Must be between 12 and 16 characters."),

    secret_confirm_placeholder: T("Secret (Confirm)"),
    secret_confirm_tooltip: T("Retype the <i>Secret</i>."),

    step3_label: T("Initiator"),

    initiators_placeholder: T("Initiators"),
    initiators_tooltip: T("Enter <i>ALL</i> or a list of initiator hostnames separated by spaces."),

    auth_network_placeholder: T("Authorized Networks"),
    auth_network_tooltip: T("Network addresses that can use this initiator. Enter <i>ALL</i> or list network addresses with\
 a CIDR mask. Separate multiple addresses with a space: <i>192.168.2.0/24 192.168.2.1/12</i>."),
}