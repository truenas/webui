import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemUpdate = {
  filelocation: {
    placeholder: T('Update File Temporary Storage Location'),
    tooltip: T(
      'The update file is temporarily stored here before being applied.',
    ),
  },

  filename: {
    placeholder: T('Update File'),
    tooltip: T(
      'The file used to manually update the system. Browse to\
 the update file stored on the system logged into the\
 web interface to upload and apply. Update file names\
 end with <i>-manual-update-unsigned.tar</i>',
    ),
  },

  rebootAfterManualUpdate: {
    placeholder: T('Restart After Update'),
    tooltip: T('Automatically restart the system after the update\
 is applied.'),

    manual_reboot_msg: T('Update successful. Please restart for the update to take effect. Restart now?'),
  },

  manual_update_action: T('Manual Update'),
  manual_update_description: T('Uploading file...'),

  manual_update_error_dialog: {
    message: T('Error submitting file'),
  },

  continueDialogTitle: T('Warning'),
  continueDialogAction: T('Continue with the upgrade'),

  clickForInformationLink: T('Click for information on\
    <a href="https://www.truenas.com/docs/truenasupgrades/" target="_blank">TrueNAS SCALE Migration, Nightly trains\
    and other upgrade options.</a>'),

  ha_update: {
    complete_title: T('Complete the Upgrade'),
    complete_msg: T('The standby controller has finished upgrading. To complete the update process, \
 failover to the standby controller.'),
    complete_action: T('Close'),
  },

  non_ha_download_msg: T('Continue with download?'),
  ha_download_msg: T('Upgrades both controllers. Files are downloaded to the Active Controller\
 and then transferred to the Standby Controller. The upgrade process starts concurrently on both TrueNAS Controllers.\
 Continue with download?'),
  non_ha_confirm_msg: T('Apply updates and restart system after downloading.'),
  ha_confirm_msg: T('Check the box for full upgrade. Leave unchecked to download only.'),
};
