import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';

/** Middleware's `status_code` for a pool that did not import because its self-encrypting disks are locked. */
export const lockedSedDisksStatusCode = 'LOCKED_SED_DISKS';

/**
 * A pool that is configured on the system (it comes from `pool.query`) but that ZFS has not imported,
 * which `pool.reimport` can try to import again.
 *
 * Not narrowed to locked SED disks: middleware only reports `LOCKED_SED_DISKS` while a disk is still
 * locked, so once the disks are unlocked — the point at which a re-import can succeed — the pool is
 * just OFFLINE with no status code.
 */
export function isOfflinePool(pool: Pool | null | undefined): boolean {
  return pool?.status === PoolStatus.Offline;
}

export function isSedLockedPool(pool: Pool | null | undefined): boolean {
  return isOfflinePool(pool)
    && pool.all_sed === true
    && pool.status_code === lockedSedDisksStatusCode;
}
