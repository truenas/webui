import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';

export const helptextSystemAdvanced = {
  fieldset_sed: T('Self-Encrypting Drive'),
  fieldset_sysctl: T('Sysctl'),
  fieldset_cron: T('Cron Jobs'),
  fieldset_initshutdown: T('Init/Shutdown Scripts'),
  fieldset_sessions_table: T('Active Sessions'),
  fieldset_addresses: T('Allowed IP Addresses'),

  dialog_generate_debug_title: T('Generate Debug File'),
  dialog_generate_debug_message: T('This operation might take a long time. It cannot be aborted once started. Proceed?'),
  dialog_button_ok: T('Proceed'),

  system_dataset_tooltip: T('Store system logs on the system dataset. Unset to store system logs in <i>/var/</i> on the operating system device.'),

  consolemenu_tooltip: T('Unset to add a login prompt to the system before\
 the console menu is shown.'),

  serialconsole_tooltip: T('Do not set this if the Serial Port is disabled.'),

  serialport_tooltip: T('Select the serial port address in hex.'),

  serialspeed_tooltip: T('Choose the speed in bps used by the serial port.'),

  autotune_tooltip: T('Activates a tuning script which attempts to optimize \
 the system depending on the installed hardware. <b>Warning:</b> Autotuning \
 is only used as a temporary measure and is not a permanent fix for system \
 hardware issues.'),

  debugkernel_tooltip: T('Set to boot a debug kernel after the next system\
  reboot.'),

  max_parallel_replication_tasks_tooltip: T('Maximum number of replication tasks being executed \
simultaneously.'),

  motd_tooltip: T('The message to show when a user logs in with SSH.'),

  fqdn_tooltip: T('Set to include the Fully-Qualified Domain Name (FQDN)\
 in logs to precisely identify systems with similar\
 hostnames.'),

  sed_user_placeholder: T('ATA Security User'),
  sed_user_tooltip: T('User passed to <i>camcontrol security -u</i> to unlock\
 SEDs'),

  sed_passwd_placeholder: T('SED Password'),
  sed_passwd_tooltip: T('Global password to unlock SEDs.'),

  sed_passwd2_placeholder: T('Confirm SED Password'),

  debug_download_failed_message: T('Debug could not be downloaded.'),

  sysloglevel: {
    tooltip: T(
      'When <i>Syslog Server</i> is defined, only logs matching this\
 level are sent.',
    ),
    options: [
      { label: T('Emergency'), value: SyslogLevel.Emergency },
      { label: T('Alert'), value: SyslogLevel.Alert },
      { label: T('Critical'), value: SyslogLevel.Critical },
      { label: T('Error'), value: SyslogLevel.Error },
      { label: T('Warning'), value: SyslogLevel.Warning },
      { label: T('Notice'), value: SyslogLevel.Notice },
      { label: T('Info'), value: SyslogLevel.Info },
      { label: T('Debug'), value: SyslogLevel.Debug },
    ],
  },

  syslogserver: {
    tooltip: T(
      'Remote syslog server DNS hostname or IP address.\
 Nonstandard port numbers can be used by adding\
 a colon and the port number to the hostname, like\
 <samp>mysyslogserver:1928</samp>. Log entries\
 are written to local logs and sent to the remote\
 syslog server.',
    ),
  },

  syslog_transport: {
    tooltip: T('<a href="https://tools.ietf.org/html/rfc8095" target="_blank">Transport Protocol</a>\
 for the remote system log server connection. Choosing Transport Layer Security (TLS)\
 also requires selecting a preconfigured system Certificate.'),
    options: [
      { label: 'UDP', value: SyslogTransport.Udp },
      { label: 'TCP', value: SyslogTransport.Tcp },
      { label: 'TLS', value: SyslogTransport.Tls },
    ],
  },

  syslog_tls_certificate: {
    tooltip: T('The preconfigured system <i>Certificate</i> to use for authenticating\
 the TLS protocol connection to the remote system log server.'),
  },

  first_time: {
    title: T('Warning'),
    message: T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.'),
  },
};
