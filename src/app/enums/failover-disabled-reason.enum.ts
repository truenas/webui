export enum FailoverDisabledReason {
  NoVolume = 'NO_VOLUME',
  NoVip = 'NO_VIP',
  NoSystemReady = 'NO_SYSTEM_READY',
  NoPong = 'NO_PONG',
  NoFailover = 'NO_FAILOVER',
  NoLicense = 'NO_LICENSE',
  DisagreeCarp = 'DISAGREE_CARP',
  MismatchDisks = 'MISMATCH_DISKS',
  NoCriticalInterfaces = 'NO_CRITICAL_INTERFACES',
  NoFenced = 'NO_FENCED',
}
