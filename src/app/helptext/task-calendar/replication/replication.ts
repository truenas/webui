import { T } from '../../../translate-marker';

export default {
    name_placeholder: T('Name'),
    name_tooltip: T('Descriptive name for the replication.'),

    direction_placeholder: T('Direction'),
    direction_tooltip: T('Direction of travel. <i>Push</i> sends \
 snapshots from the local system to a remote system, or to another \
 dataset on the local system. <i>Pull</i> takes snapshots from a remote \
 system and stores them on the local system. <i>Pull</i> requires a \
 snapshot <i>Naming Schema</i> to identify which snapshots to replicate.'),

    transport_placeholder: T('Transport'),
    transport_tooltip: T('Method of snapshot transfer:<ul> \
 <li><i>SSH</i> is supported by most systems. It requires a previously \
 created <a href="--docurl--/system.html#ssh-connection" \
 target="_blank">SSH connection</a>.</li> \
 <li><i>SSH+NETCAT</i> uses SSH to establish a connection to the \
 destination system, then uses \
 <a href="https://github.com/freenas/py-libzfs" \
 target="_blank">py-libzfs</a> to send an unencrypted data stream for \
 higher transfer speeds. This only works when replicating to a FreeNAS, \
 TrueNAS, or other system with <i>py-libzfs</i> installed.</li> \
 <li><i>LOCAL</i> efficiently replicates snapshots to another dataset on \
 the same system without using the network.</li> \
 <li><i>LEGACY</i> uses the legacy replication engine from FreeNAS 11.2 \
 and earlier.</li></ul>'),

    ssh_credentials_placeholder: T('SSH Connection'),
    ssh_credentials_tooltip: T('Choose the \
 <a href="--docurl--/system.html#ssh-connection" \
 target="_blank">SSH connection</a>.'),

    netcat_active_side_placeholder: T('Netcat Active Side'),
    netcat_active_side_tooltip: T('Establishing a connection requires \
 that one of the connection systems has open TCP ports. Choose which \
 system (<i>LOCAL</i> or <i>REMOTE</i>) will open ports. Consult your IT \
 department to determine which systems are allowed to open ports.'),

    netcat_active_side_listen_address_placeholder: T('Netcat Active Side Listen Address'),
    netcat_active_side_listen_address_tooltip: T('IP address on which\
 the connection <b>Active Side</b> listens. Defaults to <i>0.0.0.0</i>.'),

    netcat_active_side_port_min_placeholder: T('Netcat Active Side Min Port'),
    netcat_active_side_port_min_tooltip: T('Lowest port number of the \
 active side listen address that is open to connections.'),

    netcat_active_side_port_max_placeholder: T('Netcat Active Side Max Port'),
    netcat_active_side_port_max_tooltip: T('Highest port number of the \
 active side listen address that is open to connections. The first \
 available port between the minimum and maximum is used.'),

    netcat_passive_side_connect_address_placeholder: T('Netcat Active Side Connect Address'),
    netcat_passive_side_connect_address_tooltip: T('Hostname or IP \
 address used to connect to the active side system. When the active side \
 is <i>LOCAL</i>, this defaults to the <i>SSH_CLIENT</i> environment \
 variable. When the active side is <i>REMOTE</i>, this defaults to the \
 SSH connection hostname.'),

    source_datasets_placeholder: T('Source Datasets'),
    source_datasets_tooltip: T('Choose datasets on the source system to \
 be replicated. Click the <i class="material-icons">folder</i> to see \
 all datasets on the source system. Each dataset must have an associated \
 periodic snapshot task, or previously-created snapshots for a one-time \
 replication.'),

    target_dataset_placeholder: T('Target Dataset'),
    target_dataset_tooltip: T('Choose a dataset on the destination \
 system where snapshots are stored. Click the \
 <i class="material-icons">folder</i> to see all datasets on the \
 destination system. Click a dataset to set it as the target.'),

    recursive_placeholder: T('Recursive'),
    recursive_tooltip: T('Replicate all child dataset snapshots. When \
 set, <b>Exclude Child Datasets</b> becomes available.'),

    exclude_placeholder: T('Exclude Child Datasets'),
    exclude_tooltip: T('Exclude specific child dataset snapshots from \
 the replication. Use with <b>Recursive</b> snapshots. List child \
 dataset names to exclude. Example: <i>pool1/dataset1/child1</i>. A \
 recursive replication of <i>pool1/dataset1</i> snapshots includes all \
 child dataset snapshots except <i>child1</i>.'),

    properties_placeholder: T('Properties'),
    properties_tooltip: T('Include dataset properties with the replicated \
 snapshots.'),

    periodic_snapshot_tasks_placeholder: T('Periodic Snapshot Tasks'),
    periodic_snapshot_tasks_tooltip: T('Snapshot schedule for this \
 replication task. Choose from configured \
 <a href="--docurl--/tasks.html#periodic-snapshot-tasks" \
 target="_blank">Periodic Snapshot Tasks</a>. This replication task must \
 have the same <b>Recursive</b> and <b>Exclude Child Datasets</b> values \
 as the chosen periodic snapshot task. Selecting a periodic snapshot \
 schedule removes the <b>Schedule</b> field.'),

    naming_schema_placeholder: T('Naming Schema'),
    naming_schema_tooltip: T('Pattern of naming custom snapshots to be \
 replicated. Enter the name and \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=strftime" \
 target="_blank">strftime(3)</a> <i>%Y</i>, <i>%m</i>, <i>%d</i>, \
 <i>%H</i>, and <i>%M</i> strings that match the snapshots to include in \
 the replication.'),

    also_include_naming_schema_placeholder: T('Also Include Naming Schema'),
    also_include_naming_schema_tooltip: T('Pattern of naming custom \
 snapshots to include in the replication with the periodic snapshot \
 schedule. Enter the \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=strftime" \
 target="_blank">strftime(3)</a> strings that match the snapshots to \
 include in the replication.<br><br> \
 When a periodic snapshot is not linked to the replication, enter the \
 naming schema for manually created snapshots. Has the same <i>%Y</i>, \
 <i>%m</i>, <i>%d</i>, <i>%H</i>, and <i>%M</i> string requirements as \
 the <b>Naming Schema</b> in a \
 <a href="--docurl--/tasks.html#periodic-snapshot-tasks" \
 target="_blank">periodic snapshot task.'),

    auto_placeholder: T('Run Automatically'),
    auto_tooltip: T('Set to either start this replication task \
 immediately after the linked periodic snapshot task completes or \
 continue to create a separate <b>Schedule</b> for this replication.'),

    schedule_placeholder: T('Schedule'),
    schedule_tooltip: T('Start time for the replication task.'),

    schedule_picker_tooltip: T('Select a preset schedule or choose \
 <i>Custom</i> to use the advanced scheduler.'),

    schedule_begin_placeholder: T('Begin'),
    schedule_begin_tooltip: T('Start time for the replication task.'),

    schedule_end_placeholder: T('End'),
    schedule_end_tooltip: T('End time for the replication task. A \
 replication that is already in progress can continue to run past this \
 time.'),

    restrict_schedule_placeholder: T('Snapshot Replication Schedule'),
    restrict_schedule_tooltip: T('Schedule which periodic snapshots will \
 be replicated. All snapshots will be replicated by default. To choose \
 which snapshots are replicated, set the checkbox and select a schedule \
 from the drop-down menu.<br> \
 For example, there is a system that takes a snapshot every hour, but \
 the administrator has decided that only every other snapshot is needed \
 for replication. The scheduler is set to even hours and only snapshots \
 taken at those times are replicated.'),

    restrict_schedule_picker_tooltip: T('Select a preset schedule or \
 choose <i>Custom</i> to use the advanced scheduler.'),

    restrict_schedule_begin_placeholder: T('Begin'),
    restrict_schedule_begin_tooltip: T('Set a starting time when the \
 replication is not allowed to start. A replication that is already in \
 progress can continue to run past this time.'),

    restrict_schedule_end_placeholder: T('End'),
    restrict_schedule_end_tooltip: T('Set an ending time for when \
 replications are not allowed to start.'),

    only_matching_schedule_placeholder: T('Only Replicate Snapshots Matching Schedule'),
    only_matching_schedule_tooltip: T('Set to either use the \
 <b>Schedule</b> in place of the <b>Snapshot Replication Schedule</b> or \
 add the <b>Schedule</b> values to the \
 <b>Snapshot Replication Schedule</b>.'),

    allow_from_scratch_placeholder: T('Replicate from scratch if incremental is not possible'),
    allow_from_scratch_tooltip: T('If the destination system has \
 snapshots but they do not have any data in common with the source \
 snapshots, destroy all destination snapshots and do a full replication. \
 <b>Warning:</b> enabling this option can cause data loss or excessive \
 data transfer if the replication is misconfigured.'),

    hold_pending_snapshots_placeholder: T('Hold Pending Snapshots'),
    hold_pending_snapshots_tooltip: T('Prevent source system snapshots \
 that have failed replication from being automatically removed by the \
 <b>Snapshot Retention Policy</b>.'),

    retention_policy_placeholder: T('Snapshot Retention Policy'),
    retention_policy_tooltip: T('When replicated snapshots are deleted \
 from the destination system:<ul> \
 <li><i>Same as Source</i>: use the <b>Snapshot Lifetime</b> \
 from from the source periodic snapshot task.</li> \
 <li><i>Custom</i>: define a <b>Snapshot Lifetime</b> for the \
 destination system.</li> \
 <li><i>None</i>: never delete snapshots from the destination \
 system.</li>'),

    lifetime_value_placeholder: T('Snapshot Lifetime'),
    lifetime_value_tooltip: T('How long a snapshot remains on the \
 destination system. Enter a number and choose a measure of time from \
 the drop-down.'),

    lifetime_unit_placeholder: T(''),
    lifetime_unit_tooltip: T(''),

    compression_placeholder: T('Stream Compression'),
    compression_tooltip: T('Select a compression algorithm to reduce the\
 size of the data being replicated. Only appears when <i>SSH</i> is \
 chosen for <i>Transport</i> type.'),

    speed_limit_placeholder: T('Limit (Ex. 500 KiB/s, 500M, 2 TB)'),
    speed_limit_tooltip: T('Limit replication speed to this number of \
 bytes per second.'),
    speed_limit_errors: T('Invalid value. Valid values are numbers \
 followed by optional unit letters, like <samp>256k</samp> or \
 <samp>1G</samp>.'),

    dedup_placeholder: T('Send Deduplicated Stream'),
    dedup_tooltip: T('Deduplicate the stream to avoid sending redundant \
 data blocks. The destination system must also support deduplicated \
 streams. See <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" \
 target="_blank">zfs(8)</a>.'),

    large_block_placeholder: T('Allow Blocks Larger than 128KB'),
    large_block_tooltip: T('Allow sending large data blocks. The \
 destination system must also support large blocks. See \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" \
 target="_blank">zfs(8)</a>.'),

/** Not visible in 11.3
    embed_placeholder: T('Allow WRITE_EMBEDDED Records'),
    embed_tooltip: T('Use WRITE_EMBEDDED records to make the stream more \
 efficient. The destination system must also support WRITE_EMBEDDED \
 records. When the source system is using lz4 compression, the destination \
 system must use the same compression. See \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" target="_blank">zfs(8)</a>.'),
*/
    compressed_placeholder: T('Allow Compressed WRITE Records'),
    compressed_tooltip: T('Use compressed WRITE records to make the \
 stream more efficient. The destination system must also support \
 compressed WRITE records. See \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" \
 target="_blank">zfs(8)</a>.'),

    retries_placeholder: T('Number of retries for failed replications'),
    retries_tooltip: T('Number of times the replication is attempted \
 before stopping and marking the task as failed.'),

    logging_level_placeholder: T('Logging Level'),
    logging_level_tooltip: T('Message verbosity level in the replication \
 task log.'),

    enabled_placeholder: T('Enabled'),
    enabled_tooltip: T('Activates the replication schedule.'),

}
