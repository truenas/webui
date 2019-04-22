import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_update = {
  trains: {
    nightly_down: T(
      "Changing away from the nightly train is considered a downgrade and not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."
    ),
    minor_down: T(
      "Changing the minor version is considered a downgrade and is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."
    ),
    major_down: T(
      "Changing the major version is considered a downgrade and is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."
    ),
    sdk: T(
      "Changing SDK version is not a supported operation. Activate an existing boot environment that uses the desired train and boot into it to switch to that train."
    ),
    nightly_up: T(
      "Changing to a nightly train is one-way. Changing back to a stable train is not supported!"
    )
  },

  tooltip_update_check: T(
    "Check the update server daily for \
 any updates on the chosen train. \
 Automatically download an update if \
 one is available. Click \
 <i>APPLY PENDING UPDATE</i> to install \
 the downloaded update."
  ),

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
 is applied.")
  },

  secretseed: {
    placeholder: T("Include Password Secret Seed")
  },

  save_config_form: {
    message: T(
      "<b>WARNING:</b> This configuration file contains system\
 passwords and other sensitive data.<br>"
    ),
    warning: T(
      "Including the Password Secret Seed allows using this\
 configuration file with a new boot device. This also\
 decrypts all system passwords for reuse when the\
 configuration file is uploaded.\
 <b>Keep the configuration file safe and protect it from unauthorized access!</b>"
    ),
    button_text_save: T("SAVE CONFIGURATION"),
    button_text_manual_save: T("Save"),
    button_text_cancel: T("NO")
  },

  dialog_switch_train: {
    title: T("Switch Train"),
    message: T("Switch update trains?")
  },

  dialog_nightly_upgrade: {
    title: T("Warning")
  },

  dialog_download_update: {
    title: T("Download Update"),
    message: T("Continue with download?"),
    button_text: T("Apply updates and reboot system after downloading.")
  },

  snackbar_download_successful: {
    message: T("Updates successfully downloaded")
  },

  dialog_updating: {
    title: T("Update")
  },

  dialog_no_updates: {
    title: T("Check Now"),
    message: T("No updates available.")
  },

  dialog_update_error: {
    title: T("Error checking for updates.")
  },

  dialog_error: {
    title: T("Error")
  },

  dialog_apply_updates: {
    title: T("Apply Pending Updates"),
    message: T(
      "The system will reboot and be briefly unavailable while applying updates. Apply updates and reboot?"
    )
  },

  update_error: T(
    ": Automatic update check failed. Please check system network settings."
  ),
  snackbar_network_error: {
    message: T("Check the network connection"),
    action: T("Failed")
  },

  manual_update_error_dialog: {
    message: T('Error submitting file');
  }
};
