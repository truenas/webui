import { T } from "app/translate-marker";

export const helptext_system_bootenv = {
  dev_placeholder: T("Member Disk"),
  dev_tooltip: T("Select the device to attach."),

  expand_placeholder: T("Use all disk space"),
  expand_tooltip: T(
    "Gives control of how much of the new device is made\
 available to ZFS. Set to use the entire capacity of\
 the new device."
  ),

  clone_name_placeholder: T("Name"),
  clone_name_tooltip: T(
    "Enter a name for the clone of this boot environment.\
 Alphanumeric characters, dashes (*-*), underscores (*_*),\
 and periods (*.*) are allowed."
  ),
  
  clone_source_placeholder: T("Source"),
  clone_source_tooltip: T("This is the boot environment to be cloned."),

  create_name_placeholder: T("Name"),
  create_name_tooltip: T(
    "Enter the name of the boot entry.\
 Alphanumeric characters, dashes (*-*), underscores (*_*),\
 and periods (*.*) are allowed."
 ),

  list_dialog_activate_action: T("Activate"),
  list_dialog_keep_action: T("Set Keep Flag"),
  list_dialog_unkeep_action: T("Remove Keep Flag"),
  list_dialog_scrub_action: T("Start Scrub"),

  rename_name_placeholder: T("Name"),
  rename_name_tooltip: T(
    "Rename the existing boot environment.\
 Alphanumeric characters, dashes (*-*), underscores (*_*),\
 and periods (*.*) are allowed."
  ),

  replace_name_placeholder: T("Member Disk"),

  attach_dialog: {
    title: T('Device Attached'),
    message: T('was successfully attached.')
  },

  delete_failure_dialog: {
    title: T('Error'),
    message: T("Could not delete boot environment."),
  }

};
