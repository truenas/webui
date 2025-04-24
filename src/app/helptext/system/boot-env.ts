import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemBootenv = {
  memberDiskLabel: T('Member Disk'),
  memberDiskTooltip: T('Select the device to attach.'),

  expandLabel: T('Use all disk space'),
  expandTooltip: T(
    'Gives control of how much of the new device is made\
 available to ZFS. Set to use the entire capacity of\
 the new device.',
  ),

  cloneNameTooltip: T(
    'Name of the new cloned boot environment. Alphanumeric characters, dashes (-), underscores (_), \
    and periods (.) are allowed.',
  ),
  cloneSourceTooltip: T('Boot environment to be cloned.'),

  activateButton: T('Activate'),
};
