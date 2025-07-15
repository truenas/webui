import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCloudBackup = {
  local: T('Local'),
  remote: T('Remote'),
  advancedOptions: T('Advanced Options'),
  advancedRemoteOptions: T('Advanced Remote Options'),
  taskSettings: T('Task Settings'),
  control: T('Control'),

  sourcePath: T('Source Path'),
  sourcePathTooltip: T('Select the directories or files to be sent to the cloud for backup.'),

  cachePath: T('Cache Path'),
  cachePathTooltip: T('Select the directory to store the cache files. This is used to\
 speed up the backup process. If not set, performance may degrade.'),

  credentials: T('Credentials'),
  credentialsTooltip: T('Select the cloud storage provider credentials from the list of available Cloud Credentials.'),

  bucket: T('Bucket'),

  enabled: T('Enabled'),

  newBucket: T('New Bucket Name'),
  newBucketTooltip: T('Enter the name of the new bucket. Only lowercase letters, numbers, and hyphens are allowed.'),

  folder: T('Folder'),
  folderTooltip: T('Select the folder to store the backup data.'),

  name: T('Name'),

  preScript: T('Pre-script'),
  preScriptTooltip: T('Script to execute before running sync.'),

  postScript: T('Post-script'),
  postScriptTooltip: T('Script to execute after running sync.'),

  useSnapshot: T('Use Snapshot'),
  useSnapshotTooltip: T('Set to take a snapshot of the dataset before a <i>PUSH</i>.'),

  absolutePaths: T('Use Absolute Paths'),
  absolutePathsTooltip: T('Determines whether restic backup will contain absolute or relative paths'),

  exclude: T('Exclude'),
  excludeTooltip: T('List of files and directories to exclude from backup.<br> \
 Separate entries by pressing <code>Enter</code>. See \
 <a href="https://restic.readthedocs.io/en/latest/040_backup.html#excluding-files" target="_blank">restic exclude patterns</a> \
 for more details about the <code>--exclude</code> option.'),

  keepLast: T('Keep Last'),
  keepLastTooltip: T('Enter the number of last kept backups.'),

  password: T('Password'),
  schedule: T('Schedule'),

  rateLimit: T('Rate Limit'),
  rateLimitTooltip: T('Rate limit for the backup process in KiB/s. Leave empty for no rate limit.'),
};
