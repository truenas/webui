import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemNtpservers = {
  fieldset: T('NTP Server Settings'),

  address: {
    label: T('Address'),
    tooltip: T('Enter the hostname or IP address of the <b>NTP</b> server.'),
  },

  nts: {
    label: T('NTS'),
    tooltip: T('Use Network Time Security (NTS) to authenticate this server. The server must support NTS key establishment on TCP port 4460, and its TLS certificate must be trusted and match <i>Address</i>. While at least one NTS server is configured, servers without NTS (including servers from DHCP) are ignored.'),
  },

  burst: {
    label: T('Burst'),
    tooltip: T('Recommended when <i>Max. Poll</i> is greater than 10. Only use on personal NTP servers or those under direct control. <b>Do not</b> enable when using public NTP servers.'),
  },

  iburst: {
    label: T('IBurst'),
    tooltip: T('Speeds up the initial synchronization (seconds instead of minutes).'),
  },

  prefer: {
    label: T('Prefer'),
    tooltip: T('Should only be used for highly accurate <b>NTP</b> servers such as those with time monitoring hardware.'),
  },

  minpoll: {
    label: T('Min Poll'),
    tooltip: T('The minimum polling interval, in seconds, as a power of 2. For example, <i>6</i> means 2^6, or 64 seconds. The default is 6, minimum value is 4.'),
  },

  maxpoll: {
    label: T('Max Poll'),
    tooltip: T('The maximum polling interval, in seconds, as a power of 2. For example, <i>10</i> means 2^10, or 1,024 seconds. The default is 10, maximum value is 17.'),
  },

  force: {
    label: T('Force'),
    tooltip: T('Skip the connection checks before saving. Without this option, the server must be reachable and, when <i>NTS</i> is enabled, NTS key establishment with the server must succeed.'),
  },
};
