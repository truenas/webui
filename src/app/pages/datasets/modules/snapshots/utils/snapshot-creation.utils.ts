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
 * Returns the value when it's a finite, non-negative number, otherwise
 * `undefined`. Used by `pool.snapshot` property getters where middleware may
 * return `null`, `undefined`, or non-numeric strings for size-like fields
 * (`used`, `referenced`). A negative byte count is meaningless and would
 * render incorrectly through `ixFileSize`, so reject those too.
 */
export function getFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

/**
 * Converts middleware's unix-seconds `creation.parsed` to ms for the date pipes. Anything but a positive
 * finite number (an older server's `{ $date }`, a string, 0) returns `undefined` with a dev warning,
 * so a version mismatch surfaces instead of rendering a 1970 date or "Invalid Date".
 */
export function getSnapshotCreationMs(snapshot: ZfsSnapshot | null | undefined): number | undefined {
  // `parsed` is typed as `number` (the current middleware contract), but a
  // pre-rebase server can still send `{ $date: ms }`; treat the value as
  // `unknown` for the duration of the check so the legacy branch is reachable.
  const parsed: unknown = snapshot?.properties?.creation?.parsed;
  if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0) {
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
