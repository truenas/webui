import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { Option } from 'app/interfaces/option.interface';

export const helptextSystemAdvanced = {
  sedTitle: T('Self-Encrypting Drive'),
  cronTitle: T('Cron Jobs'),

  generateDebugTitle: T('Generate Debug File'),
  generateDebugMessage: T('Warning: Debugs may contain log files with personal information such as usernames or other identifying information about your system. Please review debugs and redact any sensitive information before sharing with external entities.'),
  proceed: T('Proceed'),

  systemDatasetTooltip: T('Store system logs on the system dataset. Unset to store system logs in <i>/var/</i> on the operating system device.'),
  syslogAuditTooltip: T('Check to enable Audit Logs'),

  consoleMenuTooltip: T('Unset to add a login prompt to the system before\
 the console menu is shown.'),

  serialConsoleTooltip: T('Do not set this if the Serial Port is disabled.'),

  serialPortTooltip: T('Select the serial port address in hex.'),

  serialSpeedTooltip: T('Choose the speed in bps used by the serial port.'),

  debugKernelTooltip: T('Set to boot a debug kernel after the next system\
  restart.'),

  maxParallelReplicationTasksTooltip: T('Maximum number of replication tasks being executed \
simultaneously.'),

  motdTooltip: T('The message to show when a user logs in with SSH.'),

  fqdnTooltip: T('Set to include the Fully-Qualified Domain Name (FQDN)\
 in logs to precisely identify systems with similar\
 hostnames.'),

  sedUserLabel: T('ATA Security User'),
  sedUserTooltip: T('User passed to <i>camcontrol security -u</i> to unlock\
 SEDs'),

  sedPasswordLabel: T('SED Password'),
  sedPasswordTooltip: T('Global password to unlock SEDs.'),
  sedConfirmPasswordLabel: T('Confirm SED Password'),

  retentionTooltip: T('Number of days to retain local audit messages.'),
  reservationTooltip: T('Size in GiB of refreservation to set on ZFS dataset \
 where the audit databases are stored. The refreservation specifies the \
 minimum amount of space guaranteed to the dataset, and counts against \
 the space available for other datasets in the zpool where the audit \
 dataset is located.'),
  quotaTooltip: T('Size in GiB of the maximum amount of space that may be \
 consumed by the dataset where the audit dabases are stored.'),
  quotaFillWarningTooltip: T('Percentage used of dataset quota at which to generate a warning alert.'),
  quotaFillCriticalTooltip: T('Percentage used of dataset quota at which to generate a critical alert.'),

  sysloglevel: {
    tooltip: T(
      'Select the minimum priority level to send to the remote syslog server.\
  The system only sends logs matching this level or higher.',
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

  syslogTransport: {
    tooltip: T('<a href="https://tools.ietf.org/html/rfc8095" target="_blank">Transport Protocol</a>\
 for the remote system log server connection. Choosing Transport Layer Security (TLS)\
 also requires selecting a preconfigured system Certificate.'),
    options: [
      { label: 'UDP', value: SyslogTransport.Udp },
      { label: 'TCP', value: SyslogTransport.Tcp },
      { label: 'TLS', value: SyslogTransport.Tls },
    ] as Option[],
  },

  syslogTlsCertificate: {
    tooltip: T('The preconfigured system <i>Certificate</i> to use for authenticating\
 the TLS protocol connection to the remote system log server.'),
  },

  firstTime: {
    title: T('Warning'),
    message: T('Changing Advanced settings can be dangerous when done incorrectly. Please use caution before saving.'),
  },

  allowedIpAddresses: {
    tooltip: T('You may enter a specific IP address (e.g., 192.168.1.1) for individual access, or use an \
 IP address with a subnet mask (e.g., 192.168.1.0/24) to define a range of addresses.'),
  },

  storageSettings: {
    priorityResilverEnabled: T('Resilver tasks can run at any time, but by default they have low priority \
- lower than regular ZFS I/O operations. \
You can specify a time window during which resilvering is given higher priority \
— useful for scheduling it during non-business hours.'),
    smbRebootWarning: T('Changing System Dataset Pool requires SMB service to be restarted. This will cause a temporary disruption of any active SMB connections.'),
  },
};
