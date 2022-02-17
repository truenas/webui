import { TranslateService } from '@ngx-translate/core';

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

export function getPoolStatusLabels(translate: TranslateService): Map<PoolStatus, string> {
  return new Map([
    [PoolStatus.Online, translate.instant('Online')],
    [PoolStatus.Degraded, translate.instant('Degraded')],
    [PoolStatus.Faulted, translate.instant('Faulted')],
    [PoolStatus.Offline, translate.instant('Offline')],
    [PoolStatus.Unavailable, translate.instant('Unavailable')],
    [PoolStatus.Removed, translate.instant('Removed')],
  ]);
}
