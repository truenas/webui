import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import {
  getUserType, hasShellAccess, hasSshAccess, hasTrueNasAccess, isEmptyHomeDirectory,
} from './user.helper';

describe('UserHelper', () => {
  describe('isEmptyHomeDirectory', () => {
    it('should return false for valid home directory paths', () => {
      expect(isEmptyHomeDirectory('/home/user')).toBe(false);
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

  describe('hasShellAccess', () => {
    it('returns true for users with valid shell', () => {
      expect(hasShellAccess({ shell: '/bin/bash' } as User)).toBe(true);
    });

    it('returns false for users with nologin shell', () => {
      expect(hasShellAccess({ shell: '/usr/bin/nologin' } as User)).toBe(false);
      expect(hasShellAccess({ shell: '/usr/sbin/nologin' } as User)).toBe(false);
    });
  });

  describe('hasSshAccess', () => {
    it('returns true when user has SSH public key', () => {
      expect(hasSshAccess({ sshpubkey: 'ssh-rsa AAAAB3...' } as User)).toBe(true);
    });

    it('returns true when SSH password is enabled', () => {
      expect(hasSshAccess({ ssh_password_enabled: true } as User)).toBe(true);
    });

    it('returns false when user has no SSH access', () => {
      expect(hasSshAccess({ sshpubkey: null, ssh_password_enabled: false } as User)).toBe(false);
      expect(hasSshAccess({} as User)).toBe(false);
    });
  });

  describe('hasTrueNasAccess', () => {
    it('returns true when user has has TrueNAS access', () => {
      expect(hasTrueNasAccess({ roles: [Role.FullAdmin] } as unknown as User)).toBe(true);
    });
  });
});
