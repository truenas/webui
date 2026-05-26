import { environment } from 'environments/environment';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

// On a snapshot list with hundreds of rows a stale middleware would log the
// version-mismatch warning per row; warn once per snapshot id per session.
const warnedSnapshotIds = new Set<string>();

// Exposed for tests so a `beforeEach` can clear the dedupe state between cases
// that happen to reuse the same snapshot id.
export function resetSnapshotCreationWarnings(): void {
  warnedSnapshotIds.clear();
}

/**
 * Returns the value when it's a finite number, otherwise `undefined`. Used by
 * `pool.snapshot` property getters where middleware may return `null`,
 * `undefined`, or non-numeric strings for size-like fields.
 */
export function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Middleware returns `creation.parsed` as unix-seconds; UI date pipes work in
 * milliseconds. The `typeof` guard defends against pre-rebase servers that
 * still return the legacy `{ $date }` object — those would format as "Invalid Date".
 * Anything other than a positive finite number triggers a warning so a
 * UI/middleware version mismatch (legacy object, stringified seconds, NaN)
 * surfaces in dev tools instead of silently showing nothing.
 *
 * The `parsed >= 1` check also rejects `0` and any negative value, both of
 * which would render as a 1970-or-earlier date — exactly the symptom this
 * util was added to prevent. ZFS won't realistically report those, but
 * rejecting them closes the door on the original bug class.
 */
export function getSnapshotCreationMs(snapshot: ZfsSnapshot | null | undefined): number | undefined {
  // `parsed` is typed as `number` (the current middleware contract), but a
  // pre-rebase server can still send `{ $date: ms }`; treat the value as
  // `unknown` for the duration of the check so the legacy branch is reachable.
  const parsed: unknown = snapshot?.properties?.creation?.parsed;
  if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 1) {
    return parsed * 1000;
  }
  if (parsed !== undefined && parsed !== null) {
    const key = snapshot?.id ?? snapshot?.name ?? '<unknown>';
    if (!warnedSnapshotIds.has(key)) {
      warnedSnapshotIds.add(key);
      // The warning targets developers; end users on a stale middleware can't
      // act on it, so don't spam production consoles.
      if (!environment.production) {
        console.warn('Snapshot creation.parsed is not a positive unix-seconds number; middleware/UI version mismatch?', parsed);
      }
    }
  }
  return undefined;
}
