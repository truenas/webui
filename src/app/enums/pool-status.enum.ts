import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

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

export const poolStatusLabels = new Map([
  [PoolStatus.Online, T('Online')],
  [PoolStatus.Degraded, T('Degraded')],
  [PoolStatus.Faulted, T('Faulted')],
  [PoolStatus.Offline, T('Offline')],
  [PoolStatus.Unavailable, T('Unavailable')],
  [PoolStatus.Removed, T('Removed')],
]);
