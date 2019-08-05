import { T } from '../../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('Replication task name.'),

    direction_placeholder: T('Direction'),
    direction_tooltip: T('Direction of travel. <i>Push</i> sends snapshots to a remote system.\
 <i>Pull</i> receives snapshots from a remote system.'),

    transport_placeholder: T('Transport'),
    transport_tooltip: T('Method for snapshot transfer:<ul>\
 <li><i>SSH</i> is supported by most systems. It requires a previously created\
 <a href="--docurl--/system.html#ssh-connection" target="_blank">SSH connection</a>.</li>\
 <li><i>SSH+NETCAT</i> uses SSH to establish a connection to the remote system, then uses\
 <a href="https://www.freebsd.org/cgi/man.cgi?query=nc" target="_blank">nc(1)</a> to send an unencrypted\
 data stream for higher transfer speeds. This is only an option when\
 replicating to a FreeBSD system that has <a href="https://github.com/freenas/py-libzfs"\
 target="_blank">py-libzfs</a> installed.</li>\
 <li><i>LOCAL</i> replicates snapshots to another dataset on the same system.</li>\
 <li><i>LEGACY</i> uses the legacy replication engine from FreeNAS 11.2 and earlier.</li></ul>'),

    ssh_credentials_placeholder: T('SSH Connection'),
    ssh_credentials_tooltip: T('Choose the SSH connection to use for the replication.\
 Choose from a list of connections configured in System > <a href="--docurl--/system.html#ssh-connection"\
 target="_blank">SSH connection</a>.'),

    netcat_active_side_placeholder: T('Netcat Active Side'),
    netcat_active_side_tooltip: T('System that will open ports for the direct connection'),

    netcat_active_side_listen_address_placeholder: T('Netcat Active Side Listen Address'),
    netcat_active_side_listen_address_tooltip: T(''),

    netcat_active_side_port_min_placeholder: T('Netcat Active Side Min Port'),
    netcat_active_side_port_min_tooltip: T('Lowest port number open to connections.'),

    netcat_active_side_port_max_placeholder: T('Netcat Active Side Max Port'),
    netcat_active_side_port_max_tooltip: T('Highest port number open to connections.'),

    netcat_passive_side_connect_address_placeholder: T('Netcat Active Side Connect Address'),
    netcat_passive_side_connect_address_tooltip: T(''),

    source_datasets_placeholder: T('Source Datasets'),
    source_datasets_tooltip: T('Choose one or more datasets on the source system to be replicated.\
 Each dataset must have an enabled periodic snapshot task.'),

    target_dataset_placeholder: T('Target Dataset'),
    target_dataset_tooltip: T('Enter the dataset on the remote or destination system where\
snapshots will be stored. Example: Poolname/Datasetname, not the mountpoint or filesystem path'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Replicate all child dataset snapshots.'),

    exclude_placeholder: T('Exclude Child Datasets'),
    exclude_tooltip: T('Child datasets to exclude from the recursive replication. Example:\
 Poolname/Datasetname/childdataset, not the mountpoint or filesystem path.'),

    periodic_snapshot_tasks_placeholder: T('Periodic Snapshot Tasks'),
    periodic_snapshot_tasks_tooltip: T('Snapshot source for this replication task. Choose from configured\
 <a href="--docurl--/tasks.html#periodic-snapshot-tasks" target="_blank">Periodic Snapshot Tasks</a>.\
 The replication task must have the same Recursive and Exclude Child Datasets as the chosen periodic snapshot task.'),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T(''),

    also_include_naming_schema_placeholder: T('Also Include Naming Schema'),
    also_include_naming_schema_tooltip: T(''),

    auto_placeholder: T('Run Automatically'),
    auto_tooltip: T('Start this replication task immediately after the linked periodic snapshot task completes.'),

    schedule_placeholder: T('Schedule'),
    schedule_tooltip: T('Define specific times to automatically start the replication task. Disables running the\
 replication immediately after the periodic snapshot task.'),

    schedule_picker_tooltip: T('Select a schedule preset or choose Custom to open the advanced scheduler.'),

    schedule_begin_placeholder: T('Begin'),
    schedule_begin_tooltip: T('Define a time to start the replication task.'),

    schedule_end_placeholder: T('End'),
    schedule_end_tooltip: T('Define the point in time by which replication must start. A started replication\
 task continues until it is finished.'),

    restrict_schedule_placeholder: T('Snapshot Replication Schedule'),
    restrict_schedule_tooltip: T('Use the scheduler to define which periodic snapshots are replicated. All\
 snapshots are replicated by default. For example, the periodic snapshot task takes a snapshot every hour,\
 but only every other snapshot is needed for replication. The scheduler is set to even hours and only snapshots\
 taken at those times are replicated.'),

    restrict_schedule_picker_tooltip: T('Select a schedule preset or choose Custom to open the advanced scheduler.'),

    restrict_schedule_begin_placeholder: T('Begin'),
    restrict_schedule_begin_tooltip: T('Define a starting time when the replication task cannot run.'),

    restrict_schedule_end_placeholder: T('End'),
    restrict_schedule_end_tooltip: T('Define an ending time for the replication task restriction. The task is\
 allowed to run after the specified time.'),

    only_matching_schedule_placeholder: T('Only Replicate Snapshots Matching Schedule'),
    only_matching_schedule_tooltip: T('Set to use the replication task schedule as part of the Snapshot Replication Schedule.'),

    allow_from_scratch_placeholder: T('Replicate from scratch if incremental is not possible'),
    allow_from_scratch_tooltip: T('When source snapshots are out of sync with the destination system, destroy\
 destination system snapshots and do a full copy of all configured source system snapshots.'),

    hold_pending_snapshots_placeholder: T('Hold Pending Snapshots'),
    hold_pending_snapshots_tooltip: T('Prevent source system snapshots that have failed replication from being automatically removed by the snapshot retention policy.'),

    retention_policy_placeholder: T('Snapshot Retention Policy'),
    retention_policy_tooltip: T('Define when snapshots are deleted from the destination system:<ul>\
 <li><i>Same as Source</i>: duplicate the snapshot lifetime setting from the source system.</li>\
 <li><i>Custom</i>: define a snapshot lifetime for the destination system.</li>\
 <li><i>None</i>: never delete snapshots from the destination system.</li>'),

    lifetime_value_placeholder: T('Snapshot Lifetime'),
    lifetime_value_tooltip: T('How long a snapshot will remain on the destination system. Enter a number\
 and choose a measure of time from the drop-down.'),

    lifetime_unit_placeholder: T(''),
    lifetime_unit_tooltip: T(''),

    compression_placeholder: T('Stream Compression'),
    compression_tooltip: T('Select a compression algorithm to reduce the size of the data being replicated.'),

    speed_limit_placeholder: T('Limit (Ex. 500 KiB/s, 500M, 2 TB)'),
    speed_limit_tooltip: T('Limit replication speed to this number of bytes per second.'),
    speed_limit_errors: T('Invalid value. Valid values are numbers followed by unit letters, \
 like <samp>256k</samp> or <samp>1G</samp>.'),

    dedup_placeholder: T('Send Deduplicated Stream'),
    dedup_tooltip: T('Deduplicate the stream to avoid sending redundant data blocks. The destination system\
 must also support deduplicated streams. See <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs"\
 target="_blank">zfs(8)</a>.'),

    large_block_placeholder: T('Allow Blocks Larger than 128KB'),
    large_block_tooltip: T('Enable the stream to send large data blocks. The destination system must\
 also support large blocks. See <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" target="_blank">zfs(8)</a>.'),

    embed_placeholder: T('Allow WRITE_EMBEDDED Records'),
    embed_tooltip: T('Use WRITE_EMBEDDED records to make the stream more efficient. The destination system\
 must also support WRITE_EMBEDDED records. When the source system is using lz4 compression, the destination\
 system must use the same compression. See <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" target="_blank">zfs(8)</a>.'),

    compressed_placeholder: T('Allow Compressed WRITE Records'),
    compressed_tooltip: T('Use compressed WRITE records to make the stream more efficient. The destination\
 system must also support compressed WRITE records. See <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" target="_blank">zfs(8)</a>.'),

    retries_placeholder: T('Number of retries for failed replications'),
    retries_tooltip: T('How many times the replication task will be attempted before stopping and marking it failed.'),

    logging_level_placeholder: T('Logging Level'),
    logging_level_tooltip: T('Choose the level in the system log for messages related to this replication task.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Unset to disable this replication task without deleting it.'),

}
