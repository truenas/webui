import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { isSedLockedPool } from 'app/pages/storage/components/dashboard-pool/sed-locked-warning/is-sed-locked-pool.utils';

describe('isSedLockedPool', () => {
  const lockedPool = {
    status: PoolStatus.Offline,
    all_sed: true,
    status_code: 'LOCKED_SED_DISKS',
  } as Pool;

  it('is true for an offline all-SED pool that middleware reports as having locked SED disks', () => {
    expect(isSedLockedPool(lockedPool)).toBe(true);
  });

  it('is false for other pools', () => {
    expect(isSedLockedPool(null)).toBe(false);
    expect(isSedLockedPool({ ...lockedPool, status: PoolStatus.Online })).toBe(false);
    expect(isSedLockedPool({ ...lockedPool, all_sed: false })).toBe(false);
    expect(isSedLockedPool({ ...lockedPool, status_code: 'OK' })).toBe(false);
  });
});
