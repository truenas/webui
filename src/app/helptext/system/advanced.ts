import { Validators } from "@angular/forms";
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from "app/translate-marker";
import global_helptext from '../global-helptext';

export const helptext_system_advanced = {
  fieldset_console: T('Console'),
  fieldset_storage: T('Storage'),
  fieldset_ui: T('GUI'),
  fieldset_sed: T('Self-Encrypting Drive'),
  fieldset_kernel: T('Kernel'),
  fieldset_syslog: T('Syslog'),
  fieldset_sysctl: T('Sysctl'),

  dialog_generate_debug_title: T("Generate Debug File"),
  dialog_generate_debug_message: T("This operation might take a long time. Proceed?"),
  dialog_button_ok: T('Proceed'),
  
  system_dataset_placeholder: T("Use System Dataset"),
  system_dataset_tooltip: T('Store system logs on the system dataset. Unset to store system logs in <i>/var/</i> on the operating system device.'),
  
  variable: T('Variable'),
  
  deleteVariable: {
    title: T('Variable'),
    message: T('Delete'),
  },

  debug_dialog: {
    failure_msg: T("Failed to generate debug file."),
    failure_title: T("Failed")
  },

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

  swapondrive_placeholder: T('Swap Size in GiB'),
  swapondrive_tooltip: T('By default, all data disks are created with the amount\
 of swap specified. Changing the value does not affect\
 the amount of swap on existing disks, only disks added\
 after the change. Does not affect log or cache\
 devices as they are created without swap. Setting to\
 <i>0</i> disables swap creation completely. <b>STRONGLY\
 DISCOURAGED</b>'),
  swapondrive_validation: [ Validators.required, Validators.min(0), Validators.max(99) ],

  overprovision: {
    placeholder: T('LOG (Write Cache) Overprovision Size in GiB'),
    tooltip: T('Overprovisioning a ZFS Log SSD can increase its performance and lifespan by \
 distributing writes and erases across more drive flash blocks. \
 Defining a number of GiB here overprovisions ZFS Log disks during pool creation or extension. \
 Examples: 50 GiB, 10g, 5GB'),
    error: T('Invalid value. Valid values are numbers followed by optional unit letters \
 for GiB, like <code>256g</code> or <code>1 G</code> or <code>2 GiB</code>.'),
  },
  
  autotune_placeholder: T('Enable Autotune'),
  autotune_tooltip: T('Activates a tuning script which attempts to optimize \
 the system depending on the installed hardware. <b>Warning:</b> Autotuning \
 is only used as a temporary measure and is not a permanent fix for system \
 hardware issues.'),

  debugkernel_placeholder: T('Enable Debug Kernel'),
  debugkernel_tooltip: T('Set to boot a debug kernel after the next system\
  reboot.'),

  consolemsg_placeholder: T('Show Console Messages'),
  consolemsg_tooltip: T('Display console messages in real time\
 at the bottom of the browser.'),

  motd_placeholder: T('MOTD Banner'),
  motd_tooltip: T('The message to show when a user logs in with SSH.'),

  traceback_placeholder: T('Show Tracebacks in Case of Fatal Error'),
  traceback_tooltip: T('Provides a pop-up window of diagnostic information if a\
 fatal error occurs.'),

  advancedmode_placeholder: T('Show Advanced Fields by Default'),
  advancedmode_tooltip: T('Set to always show advanced fields, when available.'),

  fqdn_placeholder: T('Use FQDN for Logging'),
  fqdn_tooltip: T('Set to include the Fully-Qualified Domain Name (FQDN)\
 in logs to precisely identify systems with similar\
 hostnames.'),

  cpu_in_percentage_placeholder: T('Report CPU Usage in Percentage'),
  cpu_in_percentage_tooltip: T('Set to display CPU usage as percentages in Reporting.'),

  sed_user_placeholder: T('ATA Security User'),
  sed_user_tooltip: T('User passed to <i>camcontrol security -u</i> to unlock\
 SEDs'),

  sed_passwd_placeholder: T('SED Password'),
  sed_passwd_tooltip: T('Global password to unlock SEDs.'),

  sed_passwd2_placeholder: T('Confirm SED Password'),
  sed_passwd2_tooltip: T(''),

  swapondrive_warning: T("A swap size of 0 is STRONGLY DISCOURAGED."),
  swapondrive_max_warning: T("Maximum swap size is 99 GiB"),

  debug_download_failed_title: T("Error Downloading File"),
  debug_download_failed_message: T("Debug could not be downloaded."),

  sysloglevel: {
    placeholder: T("Syslog Level"),
    tooltip: T(
      "When <i>Syslog Server</i> is defined, only logs matching this\
 level are sent."
    ),
    options: [
      {label:T('Emergency'), value:'F_EMERG'},
      {label:T('Alert'), value:'F_ALERT'},
      {label:T('Critical'), value:'F_CRIT'},
      {label:T('Error'), value:'F_ERR'},
      {label:T('Warning'), value:'F_WARNING'},
      {label:T('Notice'), value:'F_NOTICE'},
      {label:T('Info'), value:'F_INFO'},
      {label:T('Debug'), value:'F_DEBUG'},
      {label:T('Is Debug'), value:'F_IS_DEBUG'}
    ]
  },

  syslogserver: {
    placeholder: T("Syslog Server"),
    tooltip: T(
      "Remote syslog server DNS hostname or IP address.\
 Nonstandard port numbers can be used by adding\
 a colon and the port number to the hostname, like\
 <samp>mysyslogserver:1928</samp>. Log entries\
 are written to local logs and sent to the remote\
 syslog server."
    )
  },

  syslog_transport: {
    placeholder: T("Syslog Transport"),
    tooltip: T('<a href="https://tools.ietf.org/html/rfc8095" target="_blank">Transport Protocol</a>\
 for the remote system log server connection. Choosing Transport Layer Security (TLS)\
 also requires selecting a preconfigured system Certificate.'),
    options: [
      {label:T('UDP'), value:'UDP'},
      {label:T('TCP'), value:'TCP'},
      {label:T('TLS'), value:'TLS'},
    ]
  },

  syslog_tls_certificate: {
    placeholder: T("Syslog TLS Certificate"),
    tooltip: T('The preconfigured system <i>Certificate</i> to use for authenticating\
 the TLS protocol connection to the remote system log server.'),
  },
};
