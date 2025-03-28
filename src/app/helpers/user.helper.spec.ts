import { isEmptyHomeDirectory } from './user.helper';

describe('UserHelper', () => {
  describe('isEmptyHomeDirectory', () => {
    it('should return true for valid home directory paths', () => {
      expect(isEmptyHomeDirectory('/home/user')).toBe(true);
      expect(isEmptyHomeDirectory('/root')).toBe(true);
      expect(isEmptyHomeDirectory('/var/home/testuser')).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(isEmptyHomeDirectory('')).toBe(false);
      expect(isEmptyHomeDirectory(null)).toBe(false);
    });

    it('should return false for /nonexistent path', () => {
      expect(isEmptyHomeDirectory('/nonexistent')).toBe(false);
    });

    it('should return false for /usr/empty path', () => {
      expect(isEmptyHomeDirectory('/usr/empty')).toBe(false);
    });
  });
});
