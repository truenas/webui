import { Alert } from 'app/interfaces/alert.interface';

/**
 * Builds the key used to group duplicate instances of the same alert.
 *
 * Middleware derives `alert.key` from the alert arguments alone
 * (`json.dumps(key_from_args(args))`), so two *different* alert classes raised
 * against the same object share a key — e.g. `TierSpecialVdevWarning` and
 * `TierSpecialVdevCritical` both key on the pool name, which made a single
 * warning and a single critical alert each report a duplicate count of 2 and
 * dismiss each other. Qualifying the key with the alert class keeps unrelated
 * alerts apart while still grouping the genuine duplicates (e.g. the same alert
 * reported by both controllers of an HA pair).
 */
export function getAlertDuplicateKey(alert: Pick<Alert, 'klass' | 'key'>): string {
  return `${alert.klass}:${alert.key}`;
}
