import { Validators } from '@angular/forms';
import globalHelptext from 'app/helptext/global-helptext';
import { T } from 'app/translate-marker';

export const helptext_system_update = {
  version: {
    paraText: T('<b>Current Version:</b> '),
  },

  scaleUpdate: {
    title: T('Updating to SCALE'),
    warning: T(`<p>TrueNAS SCALE migrations are still in development and can risk configuration errors or even data loss.
    Please back up any critical data to an external system before attempting the migration. Migrating to SCALE is intended to be a one-time event.
    Reverting back to CORE after migration is unsupported.</p>

    <p>These CORE configuration items cannot migrate to SCALE:</p>
    <p>
      <ul>
        <li>&mdash; NIS Data</li>
        <li>&mdash; Jails/Plugins</li>
        <li>&mdash; Tunables</li>
        <li>&mdash; System Boot Environments</li>
        <li>&mdash; GELI encrypted pools</li>
        <li>&mdash; AFP Shares</li>
      </ul>
    </p>

    <p>For more details, please see the
    <a href="https://www.truenas.com/docs/scale/gettingstarted/migratingfromcore/" target="_blank" style="text-decoration: underline;">CORE migration documentation</a>.
    Please ensure the system is prepared for the migration and review the system configuration post-migration
     to immediately resolve any configuration issues that might have occurred.</p>`),
    haWarning: T(`Migrating a High Availability (HA) system from TrueNAS CORE to TrueNAS SCALE requires the entire
    system go offline for some time to migrate and synchronize both controllers on the new operating system.
    It is strongly recommended to contact iXsystems Support for assistance with the migration process.
    Before migrating, please back up any critical data and schedule the system outage accordingly.
    In the unlikely event of an error during migration, please be prepared to activate a previous system boot environment.`),
  },

  filelocation: {
    placeholder: T('Update File Temporary Storage Location'),
    tooltip: T(
      'The update file is temporarily stored here before being applied.',
    ),
    validation: [Validators.required],
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
    placeholder: T('Reboot After Update'),
    tooltip: T('Automatically reboot the system after the update\
 is applied.'),

    manual_reboot_msg: T('Update successful. Please reboot for the update to take effect. Reboot now?'),
  },

  manual_update_action: T('Manual Update'),
  manual_update_description: T('Uploading file...'),

  secretseed: {
    placeholder: T('Include Password Secret Seed'),
  },

  save_config_form: {
    button_text: T('Save'),
  },

  manual_update_error_dialog: {
    message: T('Error submitting file'),
  },

  sysUpdateMessage: globalHelptext.sys_update_message,

  ha_update: {
    complete_title: T('Complete the Upgrade'),
    complete_msg: T('The standby controller has finished upgrading. To complete the update process, \
 failover to the standby controller.'),
    complete_action: T('Close'),
  },

  save_config_err: {
    title: T('Error Saving Configuration Settings'),
    message: T('System failed to save configuration settings. Check the network connection. \
 To proceed with the system upgrade <b>without</b> saving a current backup of the configuration setting, select \
 the <i>Confirm</i> checkbox and click <i>Proceed with Update</i>.'),
    button_text: T('Proceed with Update'),
  },

  non_ha_download_msg: T('Continue with download?'),
  ha_download_msg: T('Upgrades both controllers. Files are downloaded to the Active Controller\
 and then transferred to the Standby Controller. The upgrade process starts concurrently on both TrueNAS Controllers.\
 Continue with download?'),
  non_ha_confirm_msg: T('Apply updates and reboot system after downloading.'),
  ha_confirm_msg: T('Check the box for full upgrade. Leave unchecked to download only.'),

  pending_title: T('Apply Pending Updates'),
  non_ha_pending_msg: T('The system will reboot and be briefly unavailable while applying updates. \
Apply updates and reboot?'),
  ha_pending_msg: T('Upgrades both controllers. Files are downloaded to the Active Controller \
and then transferred to the Standby Controller. The upgrade process starts concurrently on both TrueNAS Controllers.'),

};
