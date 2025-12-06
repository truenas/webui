import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCloudSync = {
  transferTitle: T('Transfer'),
  remoteTitle: T('Remote'),
  controlTitle: T('Control'),
  advancedOptionsTitle: T('Advanced Options'),
  advancedRemoteOptionsTitle: T('Advanced Remote Options'),

  descriptionLabel: T('Description'),

  directionLabel: T('Direction'),
  directionTooltip: T('<i>PUSH</i> sends data to cloud storage. <i>PULL</i> \
 receives data from cloud storage. Changing the direction resets the \
 <i>Transfer Mode</i> to COPY.'),

  credentialLabel: T('Credential'),
  credentialsTooltip: T('Select the cloud storage provider credentials from the\
 list of available Cloud Credentials.'),

  bucketLabel: T('Bucket'),
  bucketTooltip: T('Select the pre-defined S3 bucket to use.'),
  bucketInputTooltip: T('Enter the pre-defined S3 bucket to use.'),

  folderLabel: T('Folder'),
  folderTooltip: T('Enter or select the cloud storage location to use for this task.'),

  bucketPolicyOnlyLabel: T('Bucket Policy Only'),
  bucketPolicyOnlyTooltip: T('Access checks should use bucket-level IAM policies.'),

  encryptionLabel: T('Server Side Encryption'),
  encryptionTooltip: T('Choose <i>AES-256</i> or <i>None</i>.'),

  chunkSizeLabel: T('Upload Chunk Size (MiB)'),
  chunkSizeTooltip: T('Files are split into chunks of this size before upload.\
 Up to «--transfers» chunks can be in progress at one time. The single largest file\
 being transferred must fit into no more than 10,000 chunks.'),

  storageClassLabel: T('Storage Class'),
  storageClassTooltip: T('Classification for each S3 object. Choose a\
 class based on the specific use case or performance requirements.\
 See <a\
 href="https://docs.aws.amazon.com/AmazonS3/latest/dev/storage-class-intro.html"\
 target="_blank">Amazon S3 Storage Classes</a> for more information.'),

  acknowledgeAbuseLabel: T('Allow files which return cannotDownloadAbusiveFile to be downloaded.'),
  acknowledgeAbuseTooltip: T('If downloading a file returns the error "This file has been identified as malware or spam and cannot be downloaded" with the error code "cannotDownloadAbusiveFile" then enable this flag to indicate you acknowledge the risks of downloading the file and TrueNAS will download it anyway.'),

  fastListLabel: T('Use --fast-list'),
  fastListTooltip: T('[Use fewer transactions in exchange for more RAM.](https://rclone.org/docs/#fast-list)\
 This can also speed up or slow down the transfer.'),

  pathLabel: T('Directory/Files'),
  pathTooltip: T('Select the directories or files to be sent to the cloud\
 for Push syncs, or the destination to be written for\
 Pull syncs. Be cautious about the destination of Pull\
 jobs to avoid overwriting existing files.'),

  transferModeLabel: T('Transfer Mode'),

  syncModeExplanation: T('<b>SYNC</b>: Files on the destination are <i><u>changed</u></i> to match those on the\
 source. If a file does not exist on the source, it is also <i><u>deleted</u></i>\
 from the destination.'),

  copyModeExplanation: T('<b>COPY</b>: Files from the source are <i><u>copied</u></i> to the destination. If files with\
 the same names are present on the destination, they are <i><u>overwritten</u></i>.'),

  moveModeExplanation: T('<b>MOVE</b>: After files are <i><u>copied</u></i> from the source to the destination, they are\
 <i><u>deleted</u></i> from the source. Files with the same names on the destination are <i><u>overwritten</u></i>.'),

  snapshotLabel: T('Use Snapshot'),
  snapshotTooltip: T('This option ensures data consistency by creating a snapshot at the\
 start of the backup or synchronization task. The process involves the following steps:</br></br>\
 1. Snapshot Creation: A snapshot of the current state is taken at the moment the task is initiated.</br></br>\
 2. Backup/Sync Operation: The task utilizes the snapshot contents to perform the backup or synchronization,\
 ensuring that the data remains consistent and unchanged during the operation.</br></br>\
 3. Snapshot Removal: Once the task is completed, the snapshot is automatically removed to save storage space.</br></br>\
 This mechanism guarantees that the backup or synchronization task captures an exact state of your\
 data at the start, even if changes occur during the process.'),

  preScriptLabel: T('Pre-script'),
  preScriptTooltip: T('Script to execute before running sync.'),

  postScriptLabel: T('Post-script'),
  postScriptTooltip: T('Script to execute after running sync.'),

  remoteEncryptionLabel: T('Remote Encryption'),
  remoteEncryptionTooltip: T('Use \
 <a href="https://rclone.org/crypt/" target="_blank">rclone crypt</a> \
 to manage data encryption during <i>PUSH</i> or <i>PULL</i> transfers:<br><br> \
 <i>PUSH:</i> Encrypt files before transfer and store the encrypted \
 files on the remote system. Files are encrypted using the \
 <b>Encryption Password</b> and <b>Encryption Salt</b> values.<br><br> \
 <i>PULL:</i> Decrypt files that are being stored on the remote system \
 before the transfer. Transferring the encrypted files requires entering \
 the same <b>Encryption Password</b> and <b>Encryption Salt</b> that was \
 used to encrypt the files.<br><br> \
 Additional details about the encryption algorithm and key derivation \
 are available in the \
 <a href="https://rclone.org/crypt/#file-formats" target="_blank">rclone crypt File formats documentation</a>.'),

  filenameEncryptionLabel: T('Filename Encryption (not recommended)'),
  filenameEncryptionTooltip: T('<i>This option is experimental in rclone and we recommend you do not use it. \
 It may not work correctly with long filenames.</i><br><br> \
 Encrypt (<i>PUSH</i>) or decrypt \
 (<i>PULL</i>) file names with the rclone \
 <a href="https://rclone.org/crypt/#file-name-encryption-modes" target="_blank">"Standard" file name encryption mode</a>. \
 The original directory structure is preserved. A filename with the same \
 name always has the same encrypted filename.<br><br> \
 <i>PULL</i> tasks that have <b>Filename Encryption</b> enabled and an \
 incorrect <b>Encryption Password</b> or <b>Encryption Salt</b> will not \
 transfer any files but still report that the task was successful. To \
 verify that files were transferred successfully, click the finished \
 task status to see a list of transferred files.'),

  encryptionPasswordLabel: T('Encryption Password'),
  encryptionPasswordTooltip: T('Password to encrypt and decrypt remote \
 data. <b>Warning:</b> Always securely back up this password! Losing the \
 encryption password will result in data loss.'),

  encryptionSaltLabel: T('Encryption Salt'),
  encryptionSaltTooltip: T('Enter a long string of random characters for \
 use as <a href="https://searchsecurity.techtarget.com/definition/salt" \
 target="_blank">salt</a> for the encryption password. <b>Warning:</b> \
 Always securely back up the encryption salt value! Losing the salt \
 value will result in data loss.'),

  scheduleLabel: T('Schedule'),

  followSymlinksLabel: T('Follow Symlinks'),
  followSymlinksTooltip: T('Follow symlinks and copy the items to which they link.'),

  transfersLabel: T('Transfers'),
  transfersTooltip: T('Number of simultaneous file transfers. Enter a\
 number based on the available bandwidth and destination system\
 performance. See <a href="https://rclone.org/docs/#transfers-int"\
 target="_blank">rclone --transfers</a>.'),

  enabledLabel: T('Enabled'),

  bwlimitLabel: T('Bandwidth Limit'),
  bwlimitTooltip: T('A single bandwidth limit or bandwidth limit schedule in rclone format.\
 Separate entries by pressing <code>Enter</code>. Example: \
 <samp>08:00,512</samp> <samp>12:00,10MB</samp> <samp>13:00,512</samp> \
 <samp>18:00,30MB</samp> <samp>23:00,off</samp>.\
 Units can be specified with a suffix of <samp>b</samp> (default),\
 <samp>k</samp>, <samp>M</samp>, or <samp>G</samp>.\
 See <a href="https://rclone.org/docs/#bwlimit-bwtimetable"\
 target="_blank">rclone --bwlimit</a>.'),

  excludeLabel: T('Exclude'),
  excludeTooltip: T('List of files and directories to exclude from sync.<br> \
 Separate entries by pressing <code>Enter</code>. See \
 <a href="https://rclone.org/filtering/" target="_blank">rclone filtering</a> \
 for more details about the <code>--exclude</code> option.'),

  dryRunTitle: T('Test Cloud Sync'),
  dryRunDialog: T('Start a dry run test of this cloud sync task? The \
 system will connect to the cloud service provider and simulate \
 transferring a file. No data will be sent or received.'),

  dryRunButton: T('Dry Run'),
  dryRunDialogTitle: T('Dry Run Cloud Sync Task'),

  emptySrcDirsLabel: T('Create empty source dirs on destination after sync'),
};
