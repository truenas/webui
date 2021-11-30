export enum SshSftpLogLevel {
  Quiet = 'QUIET',
  Fatal = 'FATAL',
  Error = 'ERROR',
  Info = 'INFO',
  Verbose = 'VERBOSE',
  Debug = 'DEBUG',
  Debug2 = 'DEBUG2',
  Debug3 = 'DEBUG3',
}

export enum SshSftpLogFacility {
  Daemon = 'DAEMON',
  User = 'USER',
  Auth = 'AUTH',
  Local0 = 'LOCAL0',
  Local1 = 'LOCAL1',
  Local2 = 'LOCAL2',
  Local3 = 'LOCAL3',
  Local4 = 'LOCAL4',
  Local5 = 'LOCAL5',
  Local6 = 'LOCAL6',
  Local7 = 'LOCAL7',
}

export enum SshWeakCipher {
  None = 'NONE',
  Aes128Cbc = 'AES128-CBC',
}
