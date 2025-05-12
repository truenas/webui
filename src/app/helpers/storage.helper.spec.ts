import { VDevType } from 'app/enums/v-dev-type.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { isQuotaSet, isTopologyLimitedToOneLayout } from './storage.helper';

describe('Storage Helper', () => {
  describe('isTopologyLimitedToOneLayout', () => {
    it('returns true for Spare type', () => {
      expect(isTopologyLimitedToOneLayout(VDevType.Spare)).toBe(true);
    });

    it('returns true for Cache type', () => {
      expect(isTopologyLimitedToOneLayout(VDevType.Cache)).toBe(true);
    });

    it('returns false for other types', () => {
      expect(isTopologyLimitedToOneLayout(VDevType.Dedup)).toBe(false);
    });
  });

  describe('isQuotaSet', () => {
    it('returns true when quota > 0', () => {
      const quota = {
        quota: 10,
        obj_quota: 0,
      } as DatasetQuota;
      expect(isQuotaSet(quota)).toBe(true);
    });

    it('returns true when obj_quota > 0', () => {
      const quota = {
        quota: 0,
        obj_quota: 10,
      } as DatasetQuota;
      expect(isQuotaSet(quota)).toBe(true);
    });

    it('returns false when both quota and obj_quota = 0', () => {
      const quota = {
        quota: 0,
        obj_quota: 0,
      } as DatasetQuota;
      expect(isQuotaSet(quota)).toBe(false);
    });
  });
});
