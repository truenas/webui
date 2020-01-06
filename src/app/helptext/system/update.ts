import { Validators } from "@angular/forms";
import globalHelptext from 'app/helptext/global-helptext';
import { T } from "app/translate-marker";

export const helptext_system_update = {
  version: {
    paraText: T('<b>Current Version:</b> '),
  },

  filelocation: {
    placeholder: T("Update File Temporary Storage Location"),
    tooltip: T(
      "The update file is temporarily stored here before being applied."
    ),
    validation: [Validators.required]
  },

  filename: {
    placeholder: T("Update File"),
    tooltip: T(
      "The file used to manually update the system. Browse to\
 the update file stored on the system logged into the\
 web interface to upload and apply. Update file names\
 end with <i>-manual-update-unsigned.tar</i>"
    )
  },

  rebootAfterManualUpdate: {
    placeholder: T("Reboot After Update"),
    tooltip: T("Automatically reboot the system after the update\
 is applied."),
 
  manual_reboot_msg: T('Update successful. Please reboot for the update to take effect. Reboot now?')
  },

  manual_update_action: T('Manual Update'),
  manual_update_description: T('Uploading file...'),

  secretseed: {
    placeholder: T("Include Password Secret Seed")
  },

  save_config_form: {
    button_text: T("Save")
  },

  manual_update_error_dialog: {
    message: T('Error submitting file')
  },

  sysUpdateMessage: globalHelptext.sys_update_message,

  ha_update: {
    complete_title: T('Complete the Upgrade'),
    complete_msg: T('The standby controller has finished upgrading. To complete the update process, \
 failover to the standby controller.'),
    complete_action: T('Close')
  },

  save_config_err: {
    title: T('Error'),
    message: T('System failed to save configuration settings. Check the network connection.')
  }
  
};
