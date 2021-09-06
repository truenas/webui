export enum PoolStatus {
  Online = 'ONLINE',
  Degraded = 'DEGRADED',
  Faulted = 'FAULTED',
  Offline = 'OFFLINE',
  Unavailable = 'UNAVAIL',
  Removed = 'REMOVED',

  // TODO: Check if all of these statuses are actually coming from middleware as opposed to being added on frontend.
  Unknown = 'UNKNOWN',
  Locked = 'LOCKED',
  Healthy = 'HEALTHY',
}
