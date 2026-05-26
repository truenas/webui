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
 * Middleware returns `creation.parsed` as unix-seconds; UI date pipes work in
 * milliseconds. The `typeof` guard defends against pre-rebase servers that
 * still return the legacy `{ $date }` object — those would format as "Invalid Date".
 * When the legacy shape is detected we log a warning so a UI/middleware version
 * mismatch surfaces in dev tools instead of silently showing nothing.
 */
export function getSnapshotCreationMs(snapshot: ZfsSnapshot | null | undefined): number | undefined {
  const parsed = snapshot?.properties?.creation?.parsed;
  if (typeof parsed === 'number' && Number.isFinite(parsed)) {
    return parsed * 1000;
  }
  if (parsed != null && typeof parsed === 'object') {
    const key = snapshot?.id ?? snapshot?.name ?? '<unknown>';
    if (!warnedSnapshotIds.has(key)) {
      warnedSnapshotIds.add(key);
      // The warning targets developers; end users on a stale middleware can't
      // act on it, so don't spam production consoles.
      if (!environment.production) {
        console.warn('Snapshot creation.parsed is not a unix-seconds number; middleware/UI version mismatch?', parsed);
      }
    }
  }
  return undefined;
}
