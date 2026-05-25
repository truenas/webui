import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

/**
 * Middleware returns `creation.parsed` as unix-seconds; UI date pipes work in
 * milliseconds. The `typeof` guard defends against pre-rebase servers that
 * still return the legacy `{ $date }` object — those would format as "Invalid Date".
 */
export function getSnapshotCreationMs(snapshot: ZfsSnapshot | null | undefined): number | undefined {
  const parsed = snapshot?.properties?.creation?.parsed;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed * 1000 : undefined;
}
