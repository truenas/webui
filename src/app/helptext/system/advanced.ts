import { Validators } from "@angular/forms";
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

  debugkernel_placeholder: ,
  debugkernel_tooltip: ,

  consolemsg_placeholder: ,
  consolemsg_tooltip: ,

  motd_placeholder: ,
  motd_tooltip: ,

  traceback_placeholder: ,
  traceback_tooltip: ,

  advancedmode_placeholder: ,
  advancedmode_tooltip: ,

  periodic_notifyuser_placeholder: ,
  periodic_notifyuser_tooltip: ,

  graphite_placeholder: ,
  graphite_tooltip: ,

  fqdn_placeholder: ,
  fqdn_tooltip: ,

  cpu_in_percentage_placeholder: ,
  cpu_in_percentage_tooltip: ,

  sed_options_message_paragraph: ,

  sed_user_placeholder: ,
  sed_user_tooltip: ,

  sed_passwd_placeholder: ,
  sed_passwd_tooltip: ,

  sed_passwd2_placeholder: ,
  sed_passwd2_tooltip: ,

  swapondrive_warning: T("A swap size of 0 is STRONGLY DISCOURAGED."),
};
