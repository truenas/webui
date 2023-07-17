import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum SyslogTransport {
  Udp = 'UDP',
  Tcp = 'TCP',
  Tls = 'TLS',
}

export enum SyslogLevel {
  Emergency = 'F_EMERG',
  Alert = 'F_ALERT',
  Critical = 'F_CRIT',
  Error = 'F_ERR',
  Warning = 'F_WARNING',
  Notice = 'F_NOTICE',
  Info = 'F_INFO',
  Debug = 'F_DEBUG',
}

export const syslogLevelLabels = new Map<SyslogLevel, string>([
  [SyslogLevel.Emergency, T('Emergency')],
  [SyslogLevel.Alert, T('Alert')],
  [SyslogLevel.Critical, T('Critical')],
  [SyslogLevel.Error, T('Error')],
  [SyslogLevel.Warning, T('Warning')],
  [SyslogLevel.Notice, T('Notice')],
  [SyslogLevel.Info, T('Info')],
  [SyslogLevel.Debug, T('Debug')],
]);
