import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { User } from 'app/interfaces/user.interface';

export function isEmptyHomeDirectory(home: string): boolean {
  return !home
    || home === '/nonexistent'
    || home === '/usr/empty';
}

export function getUserType(user: Pick<User, 'builtin' | 'local'>): string {
  if (user.builtin) {
    return T('Built-In');
  }
  if (user.local) {
    return T('Local');
  }

  return T('Directory Services');
}

export function hasShellAccess(user: User): boolean {
  return !['/usr/bin/nologin', '/usr/sbin/nologin'].includes(user.shell);
}

export function hasSshAccess(user: User): boolean {
  return Boolean(user.sshpubkey || user.ssh_password_enabled);
}
