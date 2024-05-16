import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextCloudBackup = {
  fieldset_local: T('Local'),
  fieldset_remote: T('Remote'),
  fieldset_task_settings: T('Task Settings'),

  source_path_placeholder: T('Source Path'),
  source_path_tooltip: T('Select the directories or files to be sent to the cloud for backup.'),

  credentials_placeholder: T('Credentials'),
  credentials_tooltip: T('Select the cloud storage provider credentials from the list of available Cloud Credentials.'),

  bucket_placeholder: T('Bucket'),
  bucket_tooltip: T('Select the name of container to use.'),

  bucket_input_placeholder: T('New Bucket Name'),
  bucket_input_tooltip: T('Input the name of container to use.'),

  folder_placeholder: T('Folder'),

  name_placeholder: T('Name'),
  name_tooltip: T('Enter a name of the Cloud Backup Task.'),

  keep_last_placeholder: T('Keep Last'),
  keep_last_tooltip: T('Enter the number of last kept backups.'),

  password_placeholder: T('Password'),
  password_tooltip: T('Enter password.'),

  schedule_placeholder: T('Schedule'),
  schedule_tooltip: T('Select a schedule preset or choose <i>Custom</i> to setup custom schedule.'),
};
