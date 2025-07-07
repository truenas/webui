import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextReplicationWizard = {
  existReplicationLabel: T('Load Previous Replication Task'),
  existReplicationTooltip: T('Use settings from a saved replication.'),

  sourceDatasetsFromLabel: T('Source Location'),
  sourceDatasetsFromTooltip: T('Storage location for the original \
 snapshots that will be replicated.'),

  targetDatasetFromLabel: T('Destination Location'),
  targetDatasetFromTooltip: T('Storage location for the replicated \
 snapshots.'),

  sshCredentialsSourceLabel: T('SSH Connection'),
  sshCredentialsSourceTooltip: T('Select an existing SSH connection \
 to a remote system or choose <i>Create New</i> to create a new SSH \
 connection.'),

  sshCredentialsTargetLabel: T('SSH Connection'),
  sshCredentialsTargetTooltip: T('Select a saved remote system SSH \
 connection or choose <i>Create New</i> to create a new SSH connection.'),

  sourceDatasetsLabel: T('Source'),
  sourceDatasetsTooltip: T('Define the path to a system location \
 that has snapshots to replicate. Click the \
 <i class="material-icons">folder</i> to see all locations on the \
 source system or click in the field to manually type a location \
 (Example: <code>pool1/dataset1</code>). Multiple source locations can \
 be selected or manually defined with a comma (<code>,</code>) separator.\
 <br><br> Selecting a location displays the number of existing snapshots \
 that can be replicated. Selecting a location that has no snapshots \
 configures the replication task to take a manual snapshot of that \
 location and replicate it to the destination.'),

  targetDatasetLabel: T('Destination'),
  targetDatasetTooltip: T('Define the path to a system location that \
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

  sudoWarning: T(`Selected SSH connection uses non-root user. Would you like to use sudo with <i>/usr/sbin/zfs</i> commands? Passwordless sudo must be enabled on the remote system.
If not checked, <i>zfs allow</i> must be used to grant non-user permissions to perform ZFS tasks. Mounting ZFS filesystems by non-root still would not be possible due to Linux restrictions.`),
  sudoTooltip: T('Controls whether the user used for SSH/SSH+NETCAT replication will have passwordless sudo enabled to execute zfs commands on the remote host.\
    If not checked, <i>zfs allow</i> must be used to grant non-user permissions to perform ZFS tasks. Mounting ZFS filesystems by non-root still would not be possible due to Linux restrictions.'),

  recursiveLabel: T('Recursive'),
  recursiveTooltip: T('Set to also replicate all snapshots contained \
 within the selected source dataset snapshots. Unset to only replicate \
 the selected dataset snapshots.'),

  encryptionLabel: T('Encryption'),
  encryptionTooltip: T('Set to use encryption when replicating data. Additional encryption options will appear. Replicating from an encrypted dataset requires enabling this option or inheriting encryption.'),

  encryptionInheritLabel: T('Inherit Encryption'),
  encryptionInheritTooltip: T('Target dataset encryption will be inherited from its parent dataset.'),

  encryptionKeyGenerateLabel: T('Generate Encryption Key'),
  encryptionKeyGenerateTooltip: T('If the <i>Hex key</i> type is chosen, an encryption key will be auto-generated.'),

  encryptionKeyHexLabel: T('Encryption Key'),
  encryptionKeyHexTooltip: T('Unset <i>Generate Encryption Key</i> to instead import a custom Hex key.'),

  encryptionKeyPassphraseLabel: T('Passphrase'),
  encryptionKeyPassphraseTooltip: T('Enter an alphanumeric encryption key. Only available when <i>Passphrase</i> is the chosen key format.'),

  encryptionKeyFormatLabel: T('Encryption Key Format'),
  encryptionKeyFormatTooltip: T('Choose between a <i>Hex</i> (base 16 numeral) or <i>Passphrase</i> (alphanumeric) style encryption key.'),

  encryptionKeyLocationTruenasdbLabel: T('Store Encryption key in Sending TrueNAS database'),
  encryptionKeyLocationTruenasdbTooltip: T('Set to store the encryption key in the TrueNAS database.'),

  encryptionKeyLocationLabel: T('Encryption Key Location in Target System'),
  encryptionKeyLocationTooltip: T('Choose a temporary location for the encryption key that will decrypt replicated data.'),

  customSnapshotsLabel: T('Replicate Custom Snapshots'),
  customSnapshotsTooltip: T('Replicate snapshots that have not been \
 created by an automated snapshot task. Requires setting a naming schema \
 for the custom snapshots.'),
  nameSchemaOrRegexPush: T('Also include snapshots with the name'),
  nameSchemaOrRegexPull: T('Include snapshots with the name'),

  nameRegexLabel: T('Snapshot Name Regular Expression'),
  namingSchemaLabel: T('Naming Schema'),
  namingSchemaTooltip: T('Pattern of naming custom snapshots to be \
 replicated. Enter the name and \
 <a href="https://man7.org/linux/man-pages/man3/strftime.3.html" target="_blank">strftime(3)</a> \
 <i>&percnt;Y</i>, <i>&percnt;m</i>, <i>&percnt;d</i>, <i>&percnt;H</i>, and <i>&percnt;M</i> strings that \
 match the snapshots to include in the replication. Separate entries by \
 pressing <code>Enter</code>. The number of snapshots matching the \
 patterns are shown.'),
  nameRegexTooltip: T('Using this option will replicate all snapshots \
 which names match specified regular expression. The \
 performance on the systems with large number of snapshots \
 will be lower, as snapshots metadata needs to be read in order \
 to determine snapshots creation order.'),
  transportLabel: T('SSH Transfer Security'),
  transportTooltip: T('Data transfer security. The connection is \
 authenticated with SSH. Data can be encrypted during transfer for \
 security or left unencrypted to maximize transfer speed. Encryption is \
 recommended, but can be disabled for increased speed on secure networks.'),

  nameLabel: T('Task Name'),

  scheduleMethodLabel: T('Replication Schedule'),
  scheduleMethodTooltip: T('Set this replication on a schedule or \
 just once.'),

  scheduleLabel: T('Schedule'),
  scheduleTooltip: T('Set specific times to snapshot the \
 <i>Source Datasets</i> and replicate the snapshots to the \
 <i>Destination Dataset</i>. Select a preset schedule or choose \
 <i>Custom</i> to use the advanced scheduler.'),

  readonlyLabel: T('Make Destination Dataset Read-only?'),
  readonlyTooltip: T('Setting this option changes the destination dataset to be read-only.\
 To continue using the default or existing dataset read permissions, leave this option unset.'),

  retentionPolicyLabel: T('Destination Snapshot Lifetime'),
  retentionPolicyTooltip: T('When replicated snapshots are deleted \
 from the destination system: <br> \
 <i>Same as Source</i>: use the configured <i>Snapshot Lifetime</i> \
 value from the source dataset periodic snapshot task.<br> \
 <i>Never Delete</i>: never delete snapshots from the destination system.<br> \
 <i>Custom</i>: set a how long a snapshot remains on the destination \
 system. Enter a number and choose a measure of time from the drop-down.'),

  clearSnapshotDialogTitle: T('Destination Snapshots Are Not Related to Replicated Snapshots'),
  clearSnapshotDialogContent: T('Destination dataset does not contain any snapshots that can be used as a basis for the incremental\
 changes in the snapshots being sent. The snapshots in the destination dataset will be deleted and the\
 replication will begin with a complete initial copy.'),
};
