import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextReplicationWizard } from 'app/helptext/data-protection/replication/replication-wizard';

export const helptextReplication = {
  name_tooltip: T('Descriptive name for the replication.'),
  direction_tooltip: T('<i>PUSH</i> sends snapshots to a destination \
 system.<br><br> \
 <i>PULL</i> connects to a remote system and retrieves snapshots \
 matching a <b>Naming Schema</b>.'),
  transport_tooltip: T('Method of snapshot transfer:<ul> \
 <li><i>SSH</i> is supported by most systems. It requires a previously \
 created connection in <b>System > SSH Connections</b>.</li> \
 <li><i>SSH+NETCAT</i> uses SSH to establish a connection to the \
 destination system, then uses \
 <a href="https://github.com/truenas/py-libzfs" \
 target="_blank">py-libzfs</a> to send an unencrypted data stream for \
 higher transfer speeds. This only works when replicating to a \
 TrueNAS, or other system with <i>py-libzfs</i> installed.</li> \
 <li><i>LOCAL</i> efficiently replicates snapshots to another dataset on \
 the same system without using the network.</li> \
 <li><i>LEGACY</i> uses the legacy replication engine from FreeNAS 11.2 \
 and earlier.</li></ul>'),

  ssh_credentials_tooltip: T('Choose a connection that has been saved in \
 <b>Credentials > Backup Credentials > SSH Connections</b>.'),

  naming_schema_tooltip: T('Pattern of naming custom snapshots to be \
 replicated. Enter the name and \
 <a href="https://man7.org/linux/man-pages/man3/strftime.3.html" target="_blank">strftime(3)</a> \
 <i>&percnt;Y</i>, <i>&percnt;m</i>, <i>&percnt;d</i>, <i>&percnt;H</i>, and <i>&percnt;M</i> strings that \
 match the snapshots to include in the replication. Separate entries by \
 pressing <code>Enter</code>. The number of snapshots matching the \
 patterns are shown.'),
  netcat_active_side_tooltip: T('Establishing a connection requires \
 that one of the connection systems has open TCP ports. Choose which \
 system (<i>LOCAL</i> or <i>REMOTE</i>) will open ports. Consult your IT \
 department to determine which systems are allowed to open ports.'),

  netcat_active_side_listen_address_tooltip: T('IP address on which\
 the connection <b>Active Side</b> listens. Defaults to <i>0.0.0.0</i>.'),

  netcat_active_side_port_min_tooltip: T('Lowest port number of the \
 active side listen address that is open to connections.'),

  netcat_active_side_port_max_tooltip: T('Highest port number of the \
 active side listen address that is open to connections. The first \
 available port between the minimum and maximum is used.'),

  netcat_passive_side_connect_address_tooltip: T('Hostname or IP \
 address used to connect to the active side system. When the active side \
 is <i>LOCAL</i>, this defaults to the <i>SSH_CLIENT</i> environment \
 variable. When the active side is <i>REMOTE</i>, this defaults to the \
 SSH connection hostname.'),

  source_datasets_tooltip: T('Define the path to a system location \
 that has snapshots to replicate. Click the \
 <i class="material-icons">folder</i> to see all locations on the \
 source system or click in the field to manually type a location \
 (Example: <code>pool1/dataset1</code>). Multiple source locations can \
 be selected or manually defined with a comma (<code>,</code>) separator.'),

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

  recursive_tooltip: T('Replicate all child dataset snapshots. When \
 set, <b>Exclude Child Datasets</b> becomes available.'),

  exclude_tooltip: T('Exclude specific child dataset snapshots from \
 the replication. Use with <b>Recursive</b> snapshots. List child \
 dataset names to exclude. Separate entries by pressing <code>Enter</code>. \
 Example: <i>pool1/dataset1/child1</i>. A recursive replication of \
 <i>pool1/dataset1</i> snapshots includes all child dataset snapshots \
 except <i>child1</i>.'),

  properties_tooltip: T('Include dataset properties with the replicated \
 snapshots.'),

  properties_override_tooltip: T('Replace existing dataset properties with these new defined properties in the replicated files.'),

  properties_exclude_tooltip: T('List any existing dataset properties to remove from the replicated files.'),

  replicate_tooltip: T('Completely replicate the selected dataset. The target \
dataset will have all of the source dataset\'s properties, child datasets, \
clones and snapshots that match the specified naming schema. Set \
Snapshot Name Regular Expression to .* to replicate all snapshots.'),

  periodic_snapshot_tasks_tooltip: T('Snapshot schedule for this \
 replication task. Choose from previously configured \
 <b>Periodic Snapshot Tasks</b>. This replication task must have the \
 same <b>Recursive</b> and <b>Exclude Child Datasets</b> values \
 as the chosen periodic snapshot task. Selecting a periodic snapshot \
 schedule removes the <b>Schedule</b> field.'),

  name_regex_tooltip: T('Using this option will replicate all snapshots \
which names match specified regular expression. The \
performance on the systems with large number of snapshots \
will be lower, as snapshots metadata needs to be read in order \
to determine snapshots creation order.'),
  also_include_naming_schema_tooltip: T('Pattern of naming custom \
 snapshots to include in the replication with the periodic snapshot \
 schedule. Enter the \
 <a href="https://man7.org/linux/man-pages/man3/strftime.3.html" \
 target="_blank">strftime(3)</a> strings that match the snapshots to \
 include in the replication.<br><br> \
 When a periodic snapshot is not linked to the replication, enter the \
 naming schema for manually created snapshots. Has the same <i>&percnt;Y</i>, \
 <i>&percnt;m</i>, <i>&percnt;d</i>, <i>&percnt;H</i>, and <i>&percnt;M</i> string requirements as \
 the <b>Naming Schema</b> in a <b>Periodic Snapshot Task</b>. Separate \
 entries by pressing <code>Enter</code>.'),

  auto_tooltip: T('Set to either start this replication task \
 immediately after the linked periodic snapshot task completes or \
 continue to create a separate <b>Schedule</b> for this replication.'),

  schedule_tooltip: T('Start time for the replication task.'),

  schedule_picker_tooltip: T('Select a preset schedule or choose \
 <i>Custom</i> to use the advanced scheduler.'),

  schedule_begin_tooltip: T('Start time for the replication task.'),

  schedule_end_tooltip: T('End time for the replication task. A \
 replication that is already in progress can continue to run past this \
 time.'),

  restrict_schedule_tooltip: T('Only replicate snapshots that match a \
 defined creation time. To specify which snapshots will be replicated, \
 set this checkbox and define the snapshot creation times that will be \
 replicated. For example, setting this time frame to <i>Hourly</i> will \
 only replicate snapshots that were created at the beginning of each hour.'),

  restrict_schedule_picker_tooltip: T('Select a preset schedule or \
 choose <i>Custom</i> to use the advanced scheduler.'),

  restrict_schedule_begin_tooltip: T('Daily time range for the specific \
 periodic snapshots to replicate, in 15 minute increments. Periodic snapshots \
 created before the <i>Begin</i> time will not be included in the replication.'),

  restrict_schedule_end_tooltip: T('Daily time range for the specific \
 periodic snapshots to replicate, in 15 minute increments. Snapshots created \
 after the <i>End</i> time will not be included in the replication.'),

  only_matching_schedule_tooltip: T('Set to use the <i>Schedule</i> in place \
 of the <i>Replicate Specific Snapshots</i> time frame. The Schedule values are \
 read over the <i>Replicate Specific Snapshots</i> time frame.'),

  readonly_tooltip: T('<b>SET</b> will changes all destination datasets to <code>readonly=on</code>\
 after finishing the replication. <br><b>REQUIRE</b> stops replication unless all existing destination\
 datasets to have the property <code>readonly=on</code>. <br><b>IGNORE</b> disables checking the\
 <code>readonly</code> property during replication.'),

  encryption_tooltip: helptextReplicationWizard.encryption_tooltip,

  encryption_inherit_tooltip: helptextReplicationWizard.encryption_inherit_tooltip,

  encryption_key_format_tooltip: helptextReplicationWizard.encryption_key_format_tooltip,

  encryption_key_generate_tooltip: helptextReplicationWizard.encryption_key_generate_tooltip,

  encryption_key_hex_tooltip: helptextReplicationWizard.encryption_key_hex_tooltip,

  encryption_key_passphrase_tooltip: helptextReplicationWizard.encryption_key_passphrase_tooltip,

  encryption_key_location_truenasdb_tooltip: helptextReplicationWizard.encryption_key_location_truenasdb_tooltip,

  encryption_key_location_tooltip: helptextReplicationWizard.encryption_key_location_tooltip,

  sudo_tooltip: helptextReplicationWizard.sudo_tooltip,

  allow_from_scratch_tooltip: T('If the destination system has \
 snapshots but they do not have any data in common with the source \
 snapshots, destroy all destination snapshots and do a full replication. \
 <b>Warning:</b> enabling this option can cause data loss or excessive \
 data transfer if the replication is misconfigured.'),

  hold_pending_snapshots_tooltip: T('Prevent source system snapshots \
 that have failed replication from being automatically removed by the \
 <b>Snapshot Retention Policy</b>.'),

  retention_policy_tooltip: T('When replicated snapshots are deleted \
 from the destination system:<ul> \
 <li><i>Same as Source</i>: use the <b>Snapshot Lifetime</b> \
 from the source periodic snapshot task.</li> \
 <li><i>Custom</i>: define a <b>Snapshot Lifetime</b> for the \
 destination system.</li> \
 <li><i>None</i>: never delete snapshots from the destination \
 system.</li>'),

  lifetime_value_tooltip: T('How long a snapshot remains on the \
 destination system. Enter a number and choose a measure of time from \
 the drop-down.'),

  compression_tooltip: T('Select a compression algorithm to reduce the\
 size of the data being replicated. Only appears when <i>SSH</i> is \
 chosen for <i>Transport</i> type.'),

  speed_limit_tooltip: T('Limit replication speed to this number of bytes per second.'),

  large_block_tooltip: T('Allow this replication to send large data blocks. The \
 destination system must also support large blocks. This setting cannot be changed \
 after it has been enabled and the replication task is created. For more details, see \
 <a href="https://linux.die.net/man/8/zfs" \
 target="_blank">zfs(8)</a>.'),

  compressed_tooltip: T('Use compressed WRITE records to make the \
 stream more efficient. The destination system must also support \
 compressed WRITE records. See \
 <a href="https://linux.die.net/man/8/zfs" \
 target="_blank">zfs(8)</a>.'),

  retries_tooltip: T('Number of times the replication is attempted \
 before stopping and marking the task as failed.'),

  logging_level_tooltip: T('Message verbosity level in the replication \
 task log.'),

  enabled_tooltip: T('Activates the replication schedule.'),
};
