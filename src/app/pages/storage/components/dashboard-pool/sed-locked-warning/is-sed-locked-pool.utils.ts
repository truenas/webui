import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';

/** Middleware's `status_code` for a pool that did not import because its self-encrypting disks are locked. */
export const lockedSedDisksStatusCode = 'LOCKED_SED_DISKS';

export function isSedLockedPool(pool: Pool | null | undefined): boolean {
  return pool?.status === PoolStatus.Offline
    && pool.all_sed === true
    && pool.status_code === lockedSedDisksStatusCode;
}
