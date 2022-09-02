import { TranslateService } from '@ngx-translate/core';
import { PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixPermissions } from 'app/interfaces/acl.interface';

export function posixPermissionsToDescription(translate: TranslateService, permissions: PosixPermissions): string {
  const allowed: string[] = [];

  if (permissions[PosixPermission.Read]) {
    allowed.push(translate.instant('Read'));
  }
  if (permissions[PosixPermission.Write]) {
    allowed.push(translate.instant('Write'));
  }
  if (permissions[PosixPermission.Execute]) {
    allowed.push(translate.instant('Execute'));
  }

  if (!allowed.length) {
    return translate.instant('None');
  }

  return allowed.join(' | ');
}
