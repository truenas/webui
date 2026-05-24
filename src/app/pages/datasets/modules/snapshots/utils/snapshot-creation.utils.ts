import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';

/**
 * Middleware returns snapshot `creation.parsed` as a unix-seconds number.
 * UI date pipes work in milliseconds. The `typeof` guard also protects against
 * mixed-version deployments where the field may still arrive as a legacy
 * `{ $date: number }` object — those would otherwise format as "Invalid Date".
 */
export function getSnapshotCreationMs(snapshot: ZfsSnapshot | null | undefined): number | undefined {
  const parsed = snapshot?.properties?.creation?.parsed;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed * 1000 : undefined;
}
