import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCloudBackup = {
  fieldset_local: T('Local'),
  fieldset_remote: T('Remote'),
  fieldset_advanced_options: T('Advanced Options'),
  fieldset_advanced_remote_options: T('Advanced Remote Options'),
  fieldset_task_settings: T('Task Settings'),
  fieldset_control: T('Control'),

  source_path_placeholder: T('Source Path'),
  source_path_tooltip: T('Select the directories or files to be sent to the cloud for backup.'),

  credentials_placeholder: T('Credentials'),
  credentials_tooltip: T('Select the cloud storage provider credentials from the list of available Cloud Credentials.'),

  bucket_placeholder: T('Bucket'),
  bucket_tooltip: T('Select the bucket to store the backup data.'),

  enabled_placeholder: T('Enabled'),
  enabled_tooltip: T('Enable this TrueCloud Backup Task. Unset to disable this TrueCloud\
 Backup Task without deleting it.'),

  bucket_input_placeholder: T('New Bucket Name'),
  bucket_input_tooltip: T('Enter the name of the new bucket. Only lowercase letters, numbers, and hyphens are allowed.'),

  folder_placeholder: T('Folder'),
  folder_tooltip: T('Select the folder to store the backup data.'),

  name_placeholder: T('Name'),
  name_tooltip: T('Enter a name of the TrueCloud Backup Task.'),

  pre_script_placeholder: T('Pre-script'),
  pre_script_tooltip: T('Script to execute before running sync.'),

  post_script_placeholder: T('Post-script'),
  post_script_tooltip: T('Script to execute after running sync.'),

  snapshot_placeholder: T('Take Snapshot'),
  snapshot_tooltip: T('Set to take a snapshot of the dataset before a <i>PUSH</i>.'),

  absolute_paths_placeholder: T('Use Absolute Paths'),
  absolute_paths_tooltip: T('Determines whether restic backup will contain absolute or relative paths'),

  transfers_placeholder: T('Transfers'),
  transfers_tooltip: T('Number of simultaneous file transfers. Enter a\
 number based on the available bandwidth and destination system\
 performance. See <a href="https://rclone.org/docs/#transfers-n"\
 target="_blank">rclone --transfers</a>.'),

  bwlimit_placeholder: T('Bandwidth Limit'),
  bwlimit_tooltip: T('A single bandwidth limit or bandwidth limit schedule in rclone format.\
 Separate entries by pressing <code>Enter</code>. Example: \
 <samp>08:00,512 12:00,10MB 13:00,512 18:00,30MB 23:00,off</samp>.\
 Units can be specified with a suffix of <samp>b</samp>,\
 <samp>k</samp> (default), <samp>M</samp>, or <samp>G</samp>.\
 See <a href="https://rclone.org/docs/#bwlimit-bandwidth-spec"\
 target="_blank">rclone --bwlimit</a>.'),

  exclude_placeholder: T('Exclude'),
  exclude_tooltip: T('List of files and directories to exclude from backup.<br> \
 Separate entries by pressing <code>Enter</code>. See \
 <a href="https://restic.readthedocs.io/en/latest/040_backup.html#excluding-files" target="_blank">restic exclude patterns</a> \
 for more details about the <code>--exclude</code> option.'),

  keep_last_placeholder: T('Keep Last'),
  keep_last_tooltip: T('Enter the number of last kept backups.'),

  password_placeholder: T('Password'),
  password_tooltip: T('Enter password.'),

  schedule_placeholder: T('Schedule'),
  schedule_tooltip: T('Select a schedule preset or choose <i>Custom</i> to setup custom schedule.'),
};
