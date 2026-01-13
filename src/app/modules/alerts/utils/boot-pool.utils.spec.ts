import { isBootPoolAlert } from './boot-pool.utils';

describe('Boot Pool Utils', () => {
  describe('isBootPoolAlert', () => {
    it('returns true for boot-pool', () => {
      expect(isBootPoolAlert({ volume: 'boot-pool', capacity: 90 })).toBe(true);
    });

    it('returns true for freenas-boot', () => {
      expect(isBootPoolAlert({ volume: 'freenas-boot', capacity: 90 })).toBe(true);
    });

    it('returns false for regular pools', () => {
      expect(isBootPoolAlert({ volume: 'tank', capacity: 90 })).toBe(false);
    });

    it('returns false for null args', () => {
      expect(isBootPoolAlert(null)).toBe(false);
    });

    it('returns false for malformed args', () => {
      expect(isBootPoolAlert({ foo: 'bar' })).toBe(false);
    });
  });
});
