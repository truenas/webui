import { User } from 'app/interfaces/user.interface';
import {
  getUserType, hasShellAccess, hasSshAccess, isEmptyHomeDirectory,
} from './user.helper';

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

  describe('hasShellAccess', () => {
    it('returns true for users with valid shell', () => {
      expect(hasShellAccess({ shell: '/bin/bash' } as User)).toBe(true);
      expect(hasShellAccess({ shell: '/bin/sh' } as User)).toBe(true);
      expect(hasShellAccess({ shell: '/usr/bin/fish' } as User)).toBe(true);
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

    it('returns true when user has both SSH key and password enabled', () => {
      expect(hasSshAccess({
        sshpubkey: 'ssh-rsa AAAAB3...',
        ssh_password_enabled: true,
      } as User)).toBe(true);
    });

    it('returns false when user has no SSH access', () => {
      expect(hasSshAccess({ sshpubkey: '', ssh_password_enabled: false } as User)).toBe(false);
      expect(hasSshAccess({ sshpubkey: null, ssh_password_enabled: false } as User)).toBe(false);
      expect(hasSshAccess({} as User)).toBe(false);
    });
  });
});
