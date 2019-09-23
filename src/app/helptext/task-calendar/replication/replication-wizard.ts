import { T } from '../../../translate-marker';

export default {
    step1_label: T('What and Where'),

    exist_replication_placeholder: T('Load Previous Replication Task'),
    exist_replication_tooltip: T('Use settings from a saved replication.'),

    source_datasets_from_placeholder: T('Source Datasets'),
    source_datasets_from_tooltip: T('Location of datasets with snapshots \
 to replicate.'),

    target_dataset_from_placeholder: T('Destination Dataset'),
    target_dataset_from_tooltip: T('Location of the dataset that will \
 store replicated snapshots.'),

    ssh_credentials_source_placeholder: T('SSH Connections'),
    ssh_credentials_source_tooltip: T('Select an existing SSH connection \
 to a remote system or choose <i>Create New</i> to create a new SSH \
 connection.'),

    ssh_credentials_target_placeholder: T('SSH Connections'),
    ssh_credentials_target_tooltip: T('Select a saved remote system SSH \
 connection or choose <i>Create New</i> to create a new SSH connection.'),

    source_datasets_placeholder: T(''),
    source_datasets_tooltip: T('Select dataset snapshots to replicate. \
 Multiple datasets can be selected.'),

    target_dataset_placeholder: T(''),
    target_dataset_tooltip: T('Select the dataset that will store \
 replicated snapshots.'),

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
 recommended, but can be disabled for increased speek on secure networks.'),

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
}
