import { T } from '../../../translate-marker';

export default {
disk_form_title: T('Edit Pool Disk'),
fieldset_disk: T('General'),
fieldset_powermgmt: T('Power Management'),
fieldset_temperature: T('Temperature Alerts'),
fieldset_smartsed: T('S.M.A.R.T./SED'),
disk_form_name_placeholder: T('Name'),
disk_form_name_tooltip : T('FreeBSD disk device name.'),

disk_form_serial_placeholder: T('Serial'),
disk_form_serial_tooltip : T('Serial number for this disk.'),

disk_form_description_placeholder: T('Description'),
disk_form_description_tooltip : T('Notes about this disk.'),

disk_form_hddstandby_placeholder: T('HDD Standby'),
disk_form_hddstandby_tooltip : T('Minutes of inactivity before the drive enters standby mode.\
 This <a href="https://forums.freenas.org/index.php?threads/how-to-find-out-if-a-drive-is-spinning-down-properly.2068/"\
 target="_blank">forum post</a> describes identifying spun down drives. Temperature monitoring is disabled for standby disks.'),

disk_form_hddstandby_options: [
 {label:T('Always On'), value:'ALWAYS ON'},
 {label:'5', value: '5'},
 {label:'10', value: '10'},
 {label:'20', value: '20'},
 {label:'30', value: '30'},
 {label:'60', value: '60'},
 {label:'120', value: '120'},
 {label:'180', value: '180'},
 {label:'240', value: '240'},
 {label:'300', value: '300'},
 {label:'330', value: '330'},
],

force_hdd_standby: {
    placeholder: T('Force HDD Standby'),
    tooltip: T('Allows the drive to enter standby, even when non-physical S.M.A.R.T. \
 operations could prevent the drive from sleeping.')
},

disk_form_advpowermgmt_placeholder: T('Advanced Power Management'),
disk_form_advpowermgmt_tooltip : T('Select a power management profile from the menu.'),
disk_form_advpowermgmt_options: [
 {label:T('Disabled'), value: 'DISABLED'},
 {label:T('Level 1 - Minimum power usage with Standby (spindown)'), value: '1'},
 {label:T('Level 64 - Intermediate power usage with Standby'), value: '64'},
 {label:T('Level 127 - Maximum power usage with Standby'), value: '127'},
 {label:T('Level 128 - Minimum power usage without Standby (no spindown)'), value: '128'},
 {label:T('Level 192 - Intermediate power usage without Standby'), value: '192'},
 {label:T('Level 254 - Maximum performance, maximum power usage'), value: '254'},
],

disk_form_acousticlevel_placeholder: T('Acoustic Level'),
disk_form_acousticlevel_tooltip : T('Modify for disks that understand <a\
 href="https://en.wikipedia.org/wiki/Automatic_acoustic_management"\
 target="_blank">AAM</a>.'),
disk_form_acousticlevel_options: [
 {label:T('Disabled'), value: 'DISABLED'},
 {label:T('Minimum'), value: 'MINIMUM'},
 {label:T('Medium'), value: 'MEDIUM'},
 {label:T('Maximum'), value: 'MAXIMUM'},
],

disk_form_togglesmart_placeholder : T('Enable S.M.A.R.T.'),
disk_form_togglesmart_tooltip : T('Enabling allows the system to conduct periodic\
 <a href="--docurl--/tasks.html#s-m-a-r-t-tests" target="_blank">S.M.A.R.T. tests</a>.'),

disk_form_smartoptions_placeholder: T('S.M.A.R.T. extra options'),
disk_form_smartoptions_tooltip : T('Additional <a\
 href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
 target="_blank">smartctl(8)</a> options.'),

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
    disks : {
        placeholder: T('Disks to be edited:'),
        tooltip : T('FreeBSD device names of each disk being edited.'),
    },
    serial : {
        placeholder: T('Serial'),
        tooltip : T('Serial numbers of each disk being edited.')
    }

}, 
dialog_error: T('Error updating disks'),

clear_pw: {
    placeholder: T('Clear SED Password'),
    tooltip: T('Clear the SED password for this disk.')
},

dw_disk_name_placeholder: T('Name'),
dw_disk_name_tooltip : T('Disk to wipe.'),

dw_wipe_method_placeholder: T('Method'),
dw_wipe_method_tooltip : T('<i>Quick</i> erases only the partitioning information\
 on a disk without clearing other old data. <i>Full\
 with zeros</i> overwrites the entire disk with zeros.\
 <i>Full with random data</i> overwrites the entire\
 disk with random binary data.'),

 manual_test_dialog: {
     title: T('Manual S.M.A.R.T. Test'),
     disk_placeholder: T('Disks'),
     type_placeholder: T('Type'),
     saveButtonText: T('Start'),
 },

 diskWipeDialogForm: {
    title: T('Wipe Disk '),
    saveButtonText: T('Wipe'),
    confirmContent: T("Wipe this disk?"),
    startDescription: T('Wiping disk...'),
    infoContent:T('Disk Wiped successfully'),
 },
}
