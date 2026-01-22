import { extractAppVersion, formatVersionLabel } from './version-formatting.utils';

describe('Version Formatting Utils', () => {
  describe('extractAppVersion', () => {
    it('extracts app version from combined format', () => {
      expect(extractAppVersion('32.0.3_2.1.22', '2.1.22')).toBe('32.0.3');
      expect(extractAppVersion('8.7.0_1.0.2', '1.0.2')).toBe('8.7.0');
      expect(extractAppVersion('24.0.6_15.3.36', '15.3.36')).toBe('24.0.6');
    });

    it('returns the same version when no suffix is present', () => {
      expect(extractAppVersion('1.0.0', '1.0.0')).toBe('1.0.0');
      expect(extractAppVersion('2.5.8', '1.0.0')).toBe('2.5.8');
    });

    it('handles undefined human version by returning library version', () => {
      expect(extractAppVersion(undefined, '1.0.0')).toBe('1.0.0');
      expect(extractAppVersion(undefined, '2.1.22')).toBe('2.1.22');
    });

    it('handles version with multiple underscores correctly', () => {
      expect(extractAppVersion('2022.10_1.0.7_2.1.22', '2.1.22')).toBe('2022.10_1.0.7');
    });

    it('does not modify human version when library version is not a suffix', () => {
      expect(extractAppVersion('32.0.3_2.1.20', '2.1.22')).toBe('32.0.3_2.1.20');
    });

    it('does not extract library version from middle of string', () => {
      expect(extractAppVersion('1.0_2.1.22_extra', '2.1.22')).toBe('1.0_2.1.22_extra');
    });
  });

  describe('formatVersionLabel', () => {
    it('formats version label with app version and catalog version by default', () => {
      expect(formatVersionLabel('2.1.22', '32.0.3_2.1.22')).toBe('32.0.3 (2.1.22)');
      expect(formatVersionLabel('1.0.2', '8.7.0_1.0.2')).toBe('8.7.0 (1.0.2)');
    });

    it('formats version label without revision when showRevision is false', () => {
      expect(formatVersionLabel('2.1.22', '32.0.3_2.1.22', { showRevision: false })).toBe('32.0.3');
      expect(formatVersionLabel('1.0.2', '8.7.0_1.0.2', { showRevision: false })).toBe('8.7.0');
    });

    it('formats version label when versions are the same', () => {
      expect(formatVersionLabel('1.0.0', '1.0.0')).toBe('1.0.0 (1.0.0)');
    });

    it('formats version label with undefined human version', () => {
      expect(formatVersionLabel('1.0.0', undefined)).toBe('1.0.0 (1.0.0)');
    });

    it('handles human version without suffix', () => {
      expect(formatVersionLabel('2.1.22', '32.0.3')).toBe('32.0.3 (2.1.22)');
    });
  });
});
