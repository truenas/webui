export enum FailoverDisabledReason {
  NoVolume = 'NO_VOLUME',
  NoVip = 'NO_VIP',
  NoSystemReady = 'NO_SYSTEM_READY',
  NoPong = 'NO_PONG',
  NoFailover = 'NO_FAILOVER',
  NoLicense = 'NO_LICENSE',
  DisagreeVip = 'DISAGREE_VIP',
  MismatchDisks = 'MISMATCH_DISKS',
  NoCriticalInterfaces = 'NO_CRITICAL_INTERFACES',
}
