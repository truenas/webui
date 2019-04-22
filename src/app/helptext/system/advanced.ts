import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";

export const helptext_system_advanced = {
  dialog_generate_debug_title: T("Generate Debug File"),
  dialog_generate_debug_message: T("This operation might take a long time. Proceed?"),
  dialog_button_ok: T('Proceed'),

  snackbar_generate_debug_message_failure: T("Check the network connection."),
  snackbar_generate_debug_action: T("Failed"),

  snackbar_network_error_message: T("Check the network connection."),
  snackbar_network_error_action: T("Failed"),

  consolemenu_placeholder: T('Show Text Console without Password Prompt'),
  consolemenu_tooltip: T('Unset to add a login prompt to the system before\
 the console menu is shown.'),

  serialconsole_placeholder: T('Enable Serial Console'),
  serialconsole_tooltip: T('Do not set this if the Serial Port is disabled.'),

  serialport_placeholder: T('Serial Port'),
  serialport_tooltip: T('Select the serial port address in hex.'),

  serialspeed_placeholder: T('Serial Speed'),
  serialspeed_tooltip: T('Choose the speed in bps used by the serial port.'),

  swapondrive_placeholder: T('Swap size in GiB'),
  swapondrive_tooltip: T('By default, all data disks are created with the amount\
 of swap specified. Changing the value does not affect\
 the amount of swap on existing disks, only disks added\
 after the change. Does not affect log or cache\
 devices as they are created without swap. Setting to\
 <i>0</i> disables swap creation completely. <b>STRONGLY\
 DISCOURAGED</b>'),
  swapondrive_validation: [ Validators.required, Validators.min(0), Validators.max(99) ],

  autotune_placeholder: T('Enable autotune'),
  autotune_tooltip: T('Enables the autotune script which attempts to optimize\
 the system depending on the installed hardware.\
 <b>Warning:</b> Autotuning is only used as a temporary\
 measure and is not a permanent fix for system hardware\
 issues. See the\
 <a href="%%docurl%%/system.html%%webversion%%#autotune"\
 target="_blank">Autotune section</a> of the guide for\
 more information.'),

  debugkernel_placeholder: T('Enable Debug Kernel'),
  debugkernel_tooltip: T('Set to boot a debug kernel after the next system\
  reboot.'),

  consolemsg_placeholder: T('Show console messages'),
  consolemsg_tooltip: T('Display console messages in real time\
 at the bottom of the browser.'),

  motd_placeholder: T('MOTD Banner'),
  motd_tooltip: T('The message to show when a user logs in with SSH.'),

  traceback_placeholder: T('Show tracebacks in case of fatal error'),
  traceback_tooltip: T('Provides a pop-up window of diagnostic information if a\
 fatal error occurs.'),

  advancedmode_placeholder: T('Show advanced fields by default'),
  advancedmode_tooltip: T('Set to always show advanced fields, when available.'),

  graphite_placeholder: T('Remote Graphite Server Hostname'),
  graphite_tooltip: T('Enter the IP address or hostname of a remote server\
 running Graphite.'),

  fqdn_placeholder: T('Use FQDN for logging'),
  fqdn_tooltip: T('Set to include the Fully-Qualified Domain Name (FQDN)\
 in logs to precisely identify systems with similar\
 hostnames.'),

  cpu_in_percentage_placeholder: T('Report CPU usage in percentage'),
  cpu_in_percentage_tooltip: T('Set to display CPU usage as percentages in Reporting.'),

  sed_options_message_paragraph: T('<b>SED (<a href="%%docurl%%/system.html%%webversion%%#self-encrypting-drives"\
 target="_blank">Self-Encrypting Drives</a>) Options</b>'),

  sed_user_placeholder: T('ATA Security User'),
  sed_user_tooltip: T('User passed to <i>camcontrol security -u</i> to unlock\
 SEDs'),

  sed_passwd_placeholder: T('SED Password'),
  sed_passwd_tooltip: T('Global password to unlock SEDs.'),

  sed_passwd2_placeholder: T('Confirm SED Password'),
  sed_passwd2_tooltip: T(''),
  sed_passwd2_validation: [ matchOtherValidator('sed_passwd') ],

  swapondrive_warning: T("A swap size of 0 is STRONGLY DISCOURAGED."),
};
