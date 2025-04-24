import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextTruecloudBackup = {
  tooltips: {
    includeExclude: T('Include or exclude files and directories from the backup.'),
    pattern: T('Enter a shell glob pattern to match files and directories to exclude from the backup.'),
    target: T('Restores files to the selected directory.'),
    excludedPaths: T('Select files and directories to exclude from the backup.'),
    includedPaths: T('Select files and directories to include from the backup. Leave empty to include everything.'),
    subFolder: T('Select a subfolder from which to restore content.'),
  },
};
