import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemBootenv = {
  dev_placeholder: T('Member Disk'),
  dev_tooltip: T('Select the device to attach.'),

  expand_placeholder: T('Use all disk space'),
  expand_tooltip: T(
    'Gives control of how much of the new device is made\
 available to ZFS. Set to use the entire capacity of\
 the new device.',
  ),

  clone_name_tooltip: T(
    'Name of the new cloned boot environment. Alphanumeric characters, dashes (-), underscores (_), \
    and periods (.) are allowed.',
  ),
  clone_source_tooltip: T('Boot environment to be cloned.'),
  create_name_tooltip: T(
    'Boot environment name. Alphanumeric characters, dashes (-), underscores (_), \
    and periods (.) are allowed.',
  ),

  list_dialog_activate_action: T('Activate'),
  list_dialog_keep_action: T('Set Keep Flag'),
  list_dialog_unkeep_action: T('Remove Keep Flag'),
  list_dialog_scrub_action: T('Start Scrub'),

  replace_name_placeholder: T('Member Disk'),
};
