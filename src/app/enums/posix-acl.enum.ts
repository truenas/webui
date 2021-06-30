import { TranslateService } from '@ngx-translate/core';

export enum PosixAclTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export function getPosixAclTagLabels(translate: TranslateService): Map<PosixAclTag, string> {
  return new Map<PosixAclTag, string>([
    [PosixAclTag.User, translate.instant('User')],
    [PosixAclTag.Group, translate.instant('Group')],
    [PosixAclTag.Other, translate.instant('Other')],
    [PosixAclTag.GroupObject, translate.instant('Group Obj')],
    [PosixAclTag.UserObject, translate.instant('User Obj')],
    [PosixAclTag.Mask, translate.instant('Mask')],
  ]);
}

export enum PosixPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}
