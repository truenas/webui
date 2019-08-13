import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
    repl_filesystem_placeholder : T('Pool/Dataset'),
    repl_filesystem_tooltip : T('On the source computer with snapshots to replicate,\
                 choose an existing ZFS pool or dataset with an\
                 active periodic snapshot task.'),
    options : [],
    required: true,
    repl_filesystem_validation : Validators.required,

    repl_zfs_placeholder : T("Remote ZFS Pool/Dataset"),
    repl_zfs_tooltip : T('Enter the ZFS pool/dataset on the remote or\
                 destination computer which will store snapshots.\
                 Example: Poolname/Datasetname, not the mountpoint\
                 or filesystem path.'),
    repl_zfs_validation : Validators.required,

    repl_userepl_placeholder : T('Recursively Replicate Child Dataset Snapshots'),
    repl_userepl_tooltip : T('Include snapshots of child datasets from the\
                 primary dataset.'),

    repl_followdelete_placeholder : T('Delete Stale Snapshots on Remote System'),
    repl_followdelete_tooltip : T('Delete snapshots from the remote system which are\
                 also no longer present on the source computer.'),

    repl_compression_placeholder : T('Replication Stream Compression'),
    repl_compression_tooltip : T('Select a compression algorithm to reduce the size\
                 of the data being replicated.'),

    name : 'repl_limit',
    repl_limit_placeholder : T('Limit (KB/s)'),
    repl_limit_tooltip : T('Limit replication speed to the specified\
 value in Kbytes/second. Zero means no limit.'),
    inputType : 'number',
    value : 0,
    repl_limit_validation : [Validators.min(0)],

    repl_begin_placeholder : T('Begin Time'),
    repl_begin_tooltip : T('Define a time to start the replication task.'),

    repl_end_placeholder : T('End Time'),
    repl_end_tooltip : T('Define the point in time by which replication must\
                 start. A started replication task continues until\
                 it is finished.'),

    repl_enabled_placeholder : T('Enabled'),
    repl_enabled_tooltip : T('Unset to disable this replication task without\
                 deleting it.'),

    repl_remote_mode_placeholder : T('Setup Mode'),
    repl_remote_mode_tooltip : T('Choose the configuration mode for the remote.\
                 <i>Semi-automatic</i> only works with remote\
                 version 9.10.2 or later.'),

    repl_remote_hostname_placeholder : T('Remote Hostname'),
    repl_remote_hostname_tooltip : T('Enter the IP address or DNS name of the remote\
                 system to receive the replication data.'),
    repl_remote_hostname_validation: Validators.required,

    repl_remote_port_placeholder : T('Remote Port'),
    repl_remote_port_tooltip : T('Enter the port used by the SSH server on the remote\
                 system.'),
    repl_remote_port_validation : [Validators.min(0)],

    repl_remote_http_port_placeholder : T('Remote HTTP/HTTPS Port'),
    repl_remote_http_port_tooltip : T('Set to the HTTPS port (usually 443) when <b>WebGUI\
                 HTTP -> HTTPS Redirect</b> is enabled in <a\
                 href="system/general"\
                 target="_blank">System/General</a> on the\
                 destination system. <b>Remote HTTPS</b> must also\
                 be enabled when creating the replication on the\
                 source system.'),
    repl_remote_http_port_validation : [Validators.min(0)],

    repl_remote_https_placeholder : T('Remote HTTPS'),
    repl_remote_https_tooltip : T('Unset to disable secure connections.'),

    repl_remote_token_placeholder : T('Remote Auth Token'),
    repl_remote_token_tooltip : T('Enter or paste the temporary token from the system\
                 with the <b>Remote ZFS Pool/Dataset</b>.'),

    repl_remote_cipher_placeholder : T('Encryption Cipher'),
    repl_remote_cipher_tooltip : T('<i>Standard</i> provides the best security.\
     <i>Fast</i> is less secure, but has better transfer rates for\
     devices with limited cryptographic speed. <i>Disabled</i> is\
     for networks where the entire path between sources and\
     destinations is trusted.'),

    repl_remote_dedicateduser_enabled_placeholder : T('Dedicated User Enabled'),
    repl_remote_dedicateduser_enabled_tooltip : T('Set to allow a user account other than <i>root</i>\
                 to be used for replication.'),

    repl_remote_dedicateduser_placeholder : T('Dedicated User'),
    repl_remote_dedicateduser_tooltip : T('Select the user account to use for replication.'),

    repl_remote_hostkey_placeholder : T('Remote Hostkey'),
    repl_remote_hostkey_tooltip : T('Paste the host key of the destination NAS\
                 for the Replication Task. Use the\
                 Scan SSH Key button to automatically retrieve the\
                 public host key of the remote system.'),
    repl_remote_hostkey_validation : [ Validators.required ]
}