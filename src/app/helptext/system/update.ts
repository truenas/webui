import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemUpdate = {
  filelocation: {
    label: T('Update File Temporary Storage Location'),
    tooltip: T(
      'The update file is temporarily stored here before being applied.',
    ),
  },

  filename: {
    label: T('Update File'),
    tooltip: T(
      'The file used to manually update the system. Browse to\
 the update file stored on the system logged into the\
 web interface to upload and apply. Update file names\
 end with <i>-manual-update-unsigned.tar</i>',
    ),
  },

  rebootAfterManualUpdate: {
    label: T('Restart After Update'),
    tooltip: T('Automatically restart the system after the update\
 is applied.'),

    manualRebootMessage: T('Update successful. Please restart for the update to take effect. Restart now?'),
  },

  manualUpdateAction: T('Manual Update'),

  continueDialogTitle: T('Warning'),
  continueDialogAction: T('Continue with the upgrade'),

  clickForInformationLink: T('Click for information on\
    <a href="https://www.truenas.com/docs/truenasupgrades/" target="_blank">TrueNAS SCALE Migration, Nightly trains\
    and other upgrade options.</a>'),

  haUpdate: {
    completeTitle: T('Complete the Upgrade'),
    completeMessage: T('The standby controller has finished upgrading. To complete the update process, \
 failover to the standby controller.'),
    completeAction: T('Close'),
  },

  nonHaDownloadMessage: T('Continue with download?'),
  haDownloadMessage: T('Upgrades both controllers. Files are downloaded to the Active Controller\
 and then transferred to the Standby Controller. The upgrade process starts concurrently on both TrueNAS Controllers.\
 Continue with download?'),
  nonHaConfirmMessage: T('Apply updates and restart system after downloading.'),
  haConfirmMessage: T('Check the box for full upgrade. Leave unchecked to download only.'),
};
