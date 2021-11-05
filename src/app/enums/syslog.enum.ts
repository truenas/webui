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
