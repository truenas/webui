import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

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
    console.warn('Snapshot creation.parsed is not a unix-seconds number; middleware/UI version mismatch?', parsed);
  }
  return undefined;
}
