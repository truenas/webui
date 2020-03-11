import { T } from '../../../translate-marker';

export default {
    step1_label: T('What and Where'),

    exist_replication_placeholder: T('Load Previous Replication Task'),
    exist_replication_tooltip: T('Use settings from a saved replication.'),

    source_datasets_from_placeholder: T('Source Location'),
    source_datasets_from_tooltip: T('Storage location for the original \
 snapshots that will be replicated.'),

    target_dataset_from_placeholder: T('Destination Location'),
    target_dataset_from_tooltip: T('Storage location for the replicated \
 snapshots.'),

    ssh_credentials_source_placeholder: T('SSH Connections'),
    ssh_credentials_source_tooltip: T('Select an existing SSH connection \
 to a remote system or choose <i>Create New</i> to create a new SSH \
 connection.'),

    ssh_credentials_target_placeholder: T('SSH Connections'),
    ssh_credentials_target_tooltip: T('Select a saved remote system SSH \
 connection or choose <i>Create New</i> to create a new SSH connection.'),

    source_datasets_placeholder: T('Source'),
    source_datasets_tooltip: T('Define the path to a system location \
 that has snapshots to replicate. Click the \
 <i class="material-icons">folder</i> to see all locations on the \
 source system or click in the field to manually type a location \
 (Example: <code>pool1/dataset1</code>). Multiple source locations can \
 be selected or manually defined with a comma (<code>,</code>) separator.\
 <br><br> Selecting a location displays the number of existing snapshots \
 that can be replicated. Selecting a location that has no snapshots \
 configures the replication task to take a manual snapshot of that \
 location and replicate it to the destination.'),

    target_dataset_placeholder: T('Destination'),
    target_dataset_tooltip: T('Define the path to a system location that \
 will store replicated snapshots. Click the \
 <i class="material-icons">folder</i> to see all locations on the \
 destination system or click in the field to manually type a location \
 path (Example: <code>pool1/dataset1</code>). Selecting a location \
 defines the full path to that location as the destination. Appending a \
 name to the path will create new zvol at that location.<br><br> \
 For example, selecting <i>pool1/dataset1</i> will store \
 snapshots in <i>dataset1</i>, but clicking the path and typing \
 <code>/zvol1</code> after <i>dataset1</i> will create <i>zvol1</i> for \
 snapshot storage.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Set to also replicate all snapshots contained \
 within the selected source dataset snapshots. Unset to only replicate \
 the selected dataset snapshots.'),

    custom_snapshots_placeholder: T('Replicate Custom Snapshots'),
    custom_snapshots_tooltip: T('Replicate snapshots that have not been \
 created by an automated snapshot task. Requires setting a naming schema \
 for the custom snapshots.'),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T('Pattern of naming custom snapshots to be \
 replicated. Enter the name and \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=strftime" target="_blank">strftime(3)</a> \
 <i>%Y</i>, <i>%m</i>, <i>%d</i>, <i>%H</i>, and <i>%M</i> strings that \
 match the snapshots to include in the replication. The number of \
 snapshots matching that pattern is shown.'),

    encryption_placeholder: T('SSH Transfer Security'),
    encryption_tooltip: T('Data transfer security. The connection is \
 authenticated with SSH. Data can be encrypted during transfer for \
 security or left unencrypted to maximize transfer speed. Encryption is \
 recommended, but can be disabled for increased speed on secure networks.'),

    name_placeholder: T('Task Name'),
    name_tooltip: T('Name of this replication configuration.'),

    step2_label: T('When'),

    schedule_method_placeholder: T('Replication Schedule'),
    schedule_method_tooltip: T('Set this replication on a schedule or \
 just once.'),

    schedule_placeholder: T('Scheduling'),
    schedule_tooltip: T('Set specific times to snapshot the \
 <i>Source Datasets</i> and replicate the snapshots to the \
 <i>Destination Dataset</i>. Select a preset schedule or choose \
 <i>Custom</i> to use the advanced scheduler.'),

    readonly_placeholder: T('Set Destination Dataset Read-only'),
    readonly_tooltip: T(''),

    retention_policy_placeholder: T('Destination Snapshot Lifetime'),
    retention_policy_tooltip: T('When replicated snapshots are deleted \
 from the destination system: <br> \
 <i>Same as Source</i>: use the configured <i>Snapshot Lifetime</i> \
 value from the source dataset periodic snapshot task.<br> \
 <i>Never Delete</i>: never delete snapshots from the destination system.<br> \
 <i>Custom</i>: set a how long a snapshot remains on the destination \
 system. Enter a number and choose a measure of time from the drop-down.'),

    lifetime_value_placeholder: T(''),
    lifetime_value_tooltip: T(''),

    lifetime_unit_tooltip: T(''),

    // dialog
    cipher_placeholder: T('Cipher'),
    cipher_tooltip: T(''),

    clearSnapshotDialog_title: T('Destination Snapshots Are Not Related to Replicated Snapshots'),
    clearSnapshotDialog_content: T('Destination dataset does not contain any snapshots that can be used as a basis for the incremental\
 changes in the snapshots being sent. The snapshots in the destination dataset will be deleted and the\
 replication will begin with a complete initial copy.'),
}
