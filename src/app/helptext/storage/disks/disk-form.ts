import { T } from '../../../translate-marker';

export default {
disk_form_name_placeholder: T('Name'),
disk_form_name_tooltip : T('This is the FreeBSD device name for the disk.'),

disk_form_serial_placeholder: T('Serial'),
disk_form_serial_tooltip : T('This is the serial number of the disk.'),

disk_form_description_placeholder: T('Description'),
disk_form_description_tooltip : T('Enter any notes about this disk.'),

disk_form_hddstandby_placeholder: T('HDD Standby'),
disk_form_hddstandby_tooltip : T('Indicates the time of inactivity in minutes before\
 the drive enters standby mode. This <a\
 href="https://forums.freenas.org/index.php?threads/how-to-find-out-if-a-drive-is-spinning-down-properly.2068/"\
 target="_blank">forum post</a> demonstrates how to\
 determine if a drive has spun down.'),

disk_form_advpowermgmt_placeholder: T('Advanced Power Management'),
disk_form_advpowermgmt_tooltip : T('Select a power management profile from the menu.'),

disk_form_acousticlevel_placeholder: T('Acoustic Level'),
disk_form_acousticlevel_tooltip : T('Modify for disks that understand <a\
 href="https://en.wikipedia.org/wiki/Automatic_acoustic_management"\
 target="_blank">AAM</a>.'),

disk_form_togglesmart_placeholder : T('Enable S.M.A.R.T.'),
disk_form_togglesmart_tooltip : T('Set by default if the disk supports S.M.A.R.T.\
 Unset to disable any configured <a\
 href="%%docurl%%/tasks.html%%webversion%%#s-m-a-r-t-tests"\
 target="_blank">S.M.A.R.T. tests</a>.'),

disk_form_smartoptions_placeholder: T('S.M.A.R.T. extra options'),
disk_form_smartoptions_tooltip : T('Additional <a\
 href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
 target="_blank">smartctl(8)</a> options.'),

disk_form_passwd_placeholder: T('SED Password'),
disk_form_passwd_tooltip: T('Password for SED'),

disk_form_passwd2_placeholder: T('Confirm SED Password'),
disk_form_passwd2_tooltip: T(''),
}
