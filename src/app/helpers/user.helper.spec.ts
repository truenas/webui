import { getUserType, isEmptyHomeDirectory } from './user.helper';

describe('UserHelper', () => {
  describe('isEmptyHomeDirectory', () => {
    it('should return false for valid home directory paths', () => {
      expect(isEmptyHomeDirectory('/home/user')).toBe(false);
      expect(isEmptyHomeDirectory('/root')).toBe(false);
      expect(isEmptyHomeDirectory('/var/home/testuser')).toBe(false);
    });

    it('should return true for empty values', () => {
      expect(isEmptyHomeDirectory('')).toBe(true);
      expect(isEmptyHomeDirectory(null)).toBe(true);
    });

    it('should return true for /nonexistent path', () => {
      expect(isEmptyHomeDirectory('/nonexistent')).toBe(true);
    });

    it('should return true for /usr/empty path', () => {
      expect(isEmptyHomeDirectory('/usr/empty')).toBe(true);
    });
  });

  describe('getUserType', () => {
    it('returns Built-In for builtin users', () => {
      expect(getUserType({ builtin: true, local: false })).toBe('Built-In');
    });

    it('returns Local for local users', () => {
      expect(getUserType({ builtin: false, local: true })).toBe('Local');
    });

    it('returns Directory Services for others', () => {
      expect(getUserType({ builtin: false, local: false })).toBe('Directory Services');
    });
  });
});
