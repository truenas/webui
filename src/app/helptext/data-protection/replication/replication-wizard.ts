import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextReplicationWizard = {
  step1_label: T('What and Where'),

  exist_replication_placeholder: T('Load Previous Replication Task'),
  exist_replication_tooltip: T('Use settings from a saved replication.'),

  source_datasets_from_placeholder: T('Source Location'),
  source_datasets_from_tooltip: T('Storage location for the original \
 snapshots that will be replicated.'),

  target_dataset_from_placeholder: T('Destination Location'),
  target_dataset_from_tooltip: T('Storage location for the replicated \
 snapshots.'),

  ssh_credentials_source_placeholder: T('SSH Connection'),
  ssh_credentials_source_tooltip: T('Select an existing SSH connection \
 to a remote system or choose <i>Create New</i> to create a new SSH \
 connection.'),

  ssh_credentials_target_placeholder: T('SSH Connection'),
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

  sudo_warning: T(`Selected SSH connection uses non-root user. Would you like to use sudo with <i>/usr/sbin/zfs</i> commands? Passwordless sudo must be enabled on the remote system.
If not checked, <i>zfs allow</i> must be used to grant non-user permissions to perform ZFS tasks. Mounting ZFS filesystems by non-root still would not be possible due to Linux restrictions.`),
  sudo_tooltip: T('Controls whether the user used for SSH/SSH+NETCAT replication will have passwordless sudo enabled to execute zfs commands on the remote host.\
    If not checked, <i>zfs allow</i> must be used to grant non-user permissions to perform ZFS tasks. Mounting ZFS filesystems by non-root still would not be possible due to Linux restrictions.'),

  recursive_placeholder: T('Recursive'),
  recursive_tooltip: T('Set to also replicate all snapshots contained \
 within the selected source dataset snapshots. Unset to only replicate \
 the selected dataset snapshots.'),

  encryption_placeholder: T('Encryption'),
  encryption_tooltip: T('Set to use encryption when replicating data. Additional encryption options will appear.'),

  encryption_inherit_placeholder: T('Inherit Encryption'),
  encryption_inherit_tooltip: T('Target dataset encryption will be inherited from its parent dataset.'),

  encryption_key_generate_placeholder: T('Generate Encryption Key'),
  encryption_key_generate_tooltip: T('If the <i>Hex key</i> type is chosen, an encryption key will be auto-generated.'),

  encryption_key_hex_placeholder: T('Encryption Key'),
  encryption_key_hex_tooltip: T('Unset <i>Generate Encryption Key</i> to instead import a custom Hex key.'),

  encryption_key_passphrase_placeholder: T('Passphrase'),
  encryption_key_passphrase_tooltip: T('Enter an alphanumeric encryption key. Only available when <i>Passphrase</i> is the chosen key format.'),

  encryption_key_format_placeholder: T('Encryption Key Format'),
  encryption_key_format_tooltip: T('Choose between a <i>Hex</i> (base 16 numeral) or <i>Passphrase</i> (alphanumeric) style encryption key.'),

  encryption_key_location_truenasdb_placeholder: T('Store Encryption key in Sending TrueNAS database'),
  encryption_key_location_truenasdb_tooltip: T('Set to store the encryption key in the TrueNAS database.'),

  encryption_key_location_placeholder: T('Encryption Key Location in Target System'),
  encryption_key_location_tooltip: T('Choose a temporary location for the encryption key that will decrypt replicated data.'),

  custom_snapshots_placeholder: T('Replicate Custom Snapshots'),
  custom_snapshots_tooltip: T('Replicate snapshots that have not been \
 created by an automated snapshot task. Requires setting a naming schema \
 for the custom snapshots.'),
  name_schema_or_regex_placeholder_push: T('Also include snapshots with the name'),
  name_schema_or_regex_placeholder_pull: T('Include snapshots with the name'),

  name_regex_placeholder: T('Snapshot Name Regular Expression'),
  naming_schema_placeholder: T('Naming Schema'),
  naming_schema_tooltip: T('Pattern of naming custom snapshots to be \
 replicated. Enter the name and \
 <a href="https://man7.org/linux/man-pages/man3/strftime.3.html" target="_blank">strftime(3)</a> \
 <i>&percnt;Y</i>, <i>&percnt;m</i>, <i>&percnt;d</i>, <i>&percnt;H</i>, and <i>&percnt;M</i> strings that \
 match the snapshots to include in the replication. Separate entries by \
 pressing <code>Enter</code>. The number of snapshots matching the \
 patterns are shown.'),
  name_regex_tooltip: T('Using this option will replicate all snapshots \
 which names match specified regular expression. The \
 performance on the systems with large number of snapshots \
 will be lower, as snapshots metadata needs to be read in order \
 to determine snapshots creation order.'),
  transport_placeholder: T('SSH Transfer Security'),
  transport_tooltip: T('Data transfer security. The connection is \
 authenticated with SSH. Data can be encrypted during transfer for \
 security or left unencrypted to maximize transfer speed. Encryption is \
 recommended, but can be disabled for increased speed on secure networks.'),

  name_placeholder: T('Task Name'),
  name_tooltip: T('Name of this replication configuration.'),

  step2_label: T('When'),

  schedule_method_placeholder: T('Replication Schedule'),
  schedule_method_tooltip: T('Set this replication on a schedule or \
 just once.'),

  schedule_placeholder: T('Schedule'),
  schedule_tooltip: T('Set specific times to snapshot the \
 <i>Source Datasets</i> and replicate the snapshots to the \
 <i>Destination Dataset</i>. Select a preset schedule or choose \
 <i>Custom</i> to use the advanced scheduler.'),

  readonly_placeholder: T('Make Destination Dataset Read-only?'),
  readonly_tooltip: T('Setting this option changes the destination dataset to be read-only.\
 To continue using the default or existing dataset read permissions, leave this option unset.'),

  retention_policy_placeholder: T('Destination Snapshot Lifetime'),
  retention_policy_tooltip: T('When replicated snapshots are deleted \
 from the destination system: <br> \
 <i>Same as Source</i>: use the configured <i>Snapshot Lifetime</i> \
 value from the source dataset periodic snapshot task.<br> \
 <i>Never Delete</i>: never delete snapshots from the destination system.<br> \
 <i>Custom</i>: set a how long a snapshot remains on the destination \
 system. Enter a number and choose a measure of time from the drop-down.'),

  // dialog
  clearSnapshotDialog_title: T('Destination Snapshots Are Not Related to Replicated Snapshots'),
  clearSnapshotDialog_content: T('Destination dataset does not contain any snapshots that can be used as a basis for the incremental\
 changes in the snapshots being sent. The snapshots in the destination dataset will be deleted and the\
 replication will begin with a complete initial copy.'),
};
