import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import {
  isOfflinePool,
  isSedLockedPool,
} from 'app/pages/storage/components/dashboard-pool/offline-pool-warning/offline-pool.utils';

describe('offline pool utils', () => {
  const lockedPool = {
    status: PoolStatus.Offline,
    all_sed: true,
    status_code: 'LOCKED_SED_DISKS',
  } as Pool;

  describe('isOfflinePool', () => {
    it('is true for any offline pool, including one whose SED disks have since been unlocked', () => {
      expect(isOfflinePool(lockedPool)).toBe(true);
      expect(isOfflinePool({ ...lockedPool, status_code: null })).toBe(true);
      expect(isOfflinePool({ status: PoolStatus.Offline, all_sed: false } as Pool)).toBe(true);
    });

    it('is false for pools that are imported', () => {
      expect(isOfflinePool(null)).toBe(false);
      expect(isOfflinePool({ ...lockedPool, status: PoolStatus.Online })).toBe(false);
      expect(isOfflinePool({ ...lockedPool, status: PoolStatus.Degraded })).toBe(false);
    });
  });

  describe('isSedLockedPool', () => {
    it('is true for an offline all-SED pool that middleware reports as having locked SED disks', () => {
      expect(isSedLockedPool(lockedPool)).toBe(true);
    });

    it('is false for other pools', () => {
      expect(isSedLockedPool(null)).toBe(false);
      expect(isSedLockedPool({ ...lockedPool, status: PoolStatus.Online })).toBe(false);
      expect(isSedLockedPool({ ...lockedPool, all_sed: false })).toBe(false);
      expect(isSedLockedPool({ ...lockedPool, status_code: 'OK' })).toBe(false);
      expect(isSedLockedPool({ ...lockedPool, status_code: null })).toBe(false);
    });
  });
});
