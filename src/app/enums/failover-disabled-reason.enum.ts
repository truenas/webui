export enum FailoverDisabledReason {
  NoVolume = 'NO_VOLUME',
  NoVip = 'NO_VIP',
  NoSystemReady = 'NO_SYSTEM_READY',
  NoPong = 'NO_PONG',
  NoFailover = 'NO_FAILOVER',
  NoLicense = 'NO_LICENSE',
  DisagreeVip = 'DISAGREE_VIP',
  MismatchDisks = 'MISMATCH_DISKS',
  MismatchVersions = 'MISMATCH_VERSIONS',
  NoCriticalInterfaces = 'NO_CRITICAL_INTERFACES',
  NoFenced = 'NO_FENCED',
  NoJournalSync = 'NO_JOURNAL_SYNC',
  RemNoJournalSync = 'REM_NO_JOURNAL_SYNC',
  RemFailoverOngoing = 'REM_FAILOVER_ONGOING',
  NoHeartbeatIface = 'NO_HEARTBEAT_IFACE',
  NoCarrierOnHeartbeat = 'NO_CARRIER_ON_HEARTBEAT',
}
