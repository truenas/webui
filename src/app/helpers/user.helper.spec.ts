import { getUserType, isEmptyHomeDirectory } from './user.helper';
import { TranslateService } from '@ngx-translate/core';

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
    const translate = {
      instant: (label: string) => label,
    } as TranslateService;

    it('returns Built-In for builtin users', () => {
      expect(getUserType({ builtin: true, local: false }, translate)).toBe('Built-In');
    });

    it('returns Local for local users', () => {
      expect(getUserType({ builtin: false, local: true }, translate)).toBe('Local');
    });

    it('returns Directory Services for others', () => {
      expect(getUserType({ builtin: false, local: false }, translate)).toBe('Directory Services');
    });
  });
});
