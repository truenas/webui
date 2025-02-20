import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';

export const helptextDisks = {
  fieldset_smart: 'S.M.A.R.T.',
  disk_form_title: T('Edit Disk'),
  fieldset_disk: T('General'),
  fieldset_powermgmt: T('Power Management'),
  fieldset_temperature: T('Temperature Alerts'),
  fieldset_sed: T('SED'),
  disk_form_name_placeholder: T('Name'),
  disk_form_name_tooltip: T('Disk device name.'),

  disk_form_serial_placeholder: T('Serial'),
  disk_form_serial_tooltip: T('Serial number for this disk.'),

  disk_form_description_placeholder: T('Description'),
  disk_form_description_tooltip: T('Notes about this disk.'),

  disk_form_hddstandby_placeholder: T('HDD Standby'),
  disk_form_hddstandby_tooltip: T('Minutes of inactivity before the drive enters standby mode. Temperature monitoring is disabled for standby disks.'),

  disk_form_hddstandby_options: [
    { label: T('Always On'), value: DiskStandby.AlwaysOn },
    { label: '5', value: DiskStandby.Minutes5 },
    { label: '10', value: DiskStandby.Minutes10 },
    { label: '20', value: DiskStandby.Minutes20 },
    { label: '30', value: DiskStandby.Minutes30 },
    { label: '60', value: DiskStandby.Minutes60 },
    { label: '120', value: DiskStandby.Minutes120 },
    { label: '180', value: DiskStandby.Minutes180 },
    { label: '240', value: DiskStandby.Minutes240 },
    { label: '300', value: DiskStandby.Minutes300 },
    { label: '330', value: DiskStandby.Minutes330 },
  ],

  disk_form_advpowermgmt_placeholder: T('Advanced Power Management'),
  disk_form_advpowermgmt_tooltip: T('Select a power management profile from the menu.'),
  disk_form_advpowermgmt_options: [
    { label: T('Disabled'), value: DiskPowerLevel.Disabled },
    { label: T('Level 1 - Minimum power usage with Standby (spindown)'), value: DiskPowerLevel.Level1 },
    { label: T('Level 64 - Intermediate power usage with Standby'), value: DiskPowerLevel.Level64 },
    { label: T('Level 127 - Maximum power usage with Standby'), value: DiskPowerLevel.Level127 },
    { label: T('Level 128 - Minimum power usage without Standby (no spindown)'), value: DiskPowerLevel.Level128 },
    { label: T('Level 192 - Intermediate power usage without Standby'), value: DiskPowerLevel.Level192 },
    { label: T('Level 254 - Maximum performance, maximum power usage'), value: DiskPowerLevel.Level254 },
  ],

  disk_form_togglesmart_placeholder: T('Enable S.M.A.R.T.'),
  disk_form_togglesmart_tooltip: T('Controls whether \
 <a href="https://www.truenas.com/docs/scale/scaleuireference/dataprotection/smarttestsscreensscale/" target="_blank">SMART monitoring and scheduled SMART tests</a> \
 are enabled.'),

  disk_form_critical_placeholder: T('Critical'),
  disk_form_critical_tooltip: T('Threshold temperature in Celsius. If the\
 drive temperature is higher than this value, a LOG_CRIT level log entry\
 is created and an email is sent. <i>0</i> disables this check.'),

  disk_form_difference_placeholder: T('Difference'),
  disk_form_difference_tooltip: T('Report if the temperature of a drive\
 has changed by this many degrees Celsius since the last report.\
 <i>0</i> disables the report.'),

  disk_form_informational_placeholder: T('Informational'),
  disk_form_informational_tooltip: T('Report if drive temperature is at or\
 above this temperature in Celsius. <i>0</i> disables the report.'),

  disk_form_passwd_placeholder: T('SED Password'),
  disk_form_passwd_tooltip: T('Set or change the password of this SED. \
 This password is used instead of the global SED password.'),

  bulk_edit: {
    title: T('Disks'),
    label: T('Settings'),
    disks: {
      placeholder: T('Disks to be edited:'),
      tooltip: T('Device names of each disk being edited.'),
    },
    serial: {
      placeholder: T('Serial'),
      tooltip: T('Serial numbers of each disk being edited.'),
    },

  },
  dialog_error: T('Error updating disks'),

  clear_pw: {
    placeholder: T('Clear SED Password'),
    tooltip: T('Clear the SED password for this disk.'),
  },

  dw_wipe_method_tooltip: T('<i>Quick</i> erases only the partitioning information\
 on a disk without clearing other old data. <i>Full\
 with zeros</i> overwrites the entire disk with zeros.\
 <i>Full with random data</i> overwrites the entire\
 disk with random binary data.'),

  diskWipeDialogForm: {
    confirmContent: T('Wipe this disk?'),
    startDescription: T('Wiping disk...'),
    infoContent: T('Disk Wiped successfully'),
  },
};
