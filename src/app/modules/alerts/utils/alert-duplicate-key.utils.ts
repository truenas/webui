import { Alert } from 'app/interfaces/alert.interface';

/**
 * Builds the key that groups duplicate instances of the same alert. Middleware derives `alert.key`
 * from the arguments alone, so different classes raised against one object share it (e.g.
 * `TierSpecialVdevWarning` and `TierSpecialVdevCritical` on a pool name). Qualifying it with the
 * class keeps those apart while still grouping real duplicates, like both controllers of an HA pair.
 */
export function getAlertDuplicateKey(alert: Pick<Alert, 'klass' | 'key'>): string {
  return `${alert.klass}:${alert.key}`;
}
