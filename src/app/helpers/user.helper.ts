import { TranslateService } from '@ngx-translate/core';
import { User } from 'app/interfaces/user.interface';

export function isEmptyHomeDirectory(home: string): boolean {
  return !home
    || home === '/nonexistent'
    || home === '/usr/empty';
}

export function getUserType(
  user: Pick<User, 'builtin' | 'local'>,
  translate: TranslateService,
): string {
  if (user.builtin) {
    return translate.instant('Built-In');
  }
  if (user.local) {
    return translate.instant('Local');
  }

  return translate.instant('Directory Services');
}
