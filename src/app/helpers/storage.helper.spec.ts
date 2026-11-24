import { VDevType } from 'app/enums/v-dev-type.enum';
import { isTopologyLimitedToOneLayout } from './storage.helper';

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
});
