import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_update = {
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
    button_text: T("Save")
  }
};
