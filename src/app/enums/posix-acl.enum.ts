import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum PosixAclTag {
  UserObject = 'USER_OBJ',
  GroupObject = 'GROUP_OBJ',
  User = 'USER',
  Group = 'GROUP',
  Other = 'OTHER',
  Mask = 'MASK',
}

export const posixAclTagLabels = new Map<PosixAclTag, string>([
  [PosixAclTag.User, T('User')],
  [PosixAclTag.Group, T('Group')],
  [PosixAclTag.Other, T('Other')],
  [PosixAclTag.GroupObject, T('Group Obj')],
  [PosixAclTag.UserObject, T('User Obj')],
  [PosixAclTag.Mask, T('Mask')],
]);

export enum PosixPermission {
  Read = 'READ',
  Write = 'WRITE',
  Execute = 'EXECUTE',
}

export const posixPermissionLabels = new Map<PosixPermission, string>([
  [PosixPermission.Read, T('Read')],
  [PosixPermission.Write, T('Write')],
  [PosixPermission.Execute, T('Execute')],
]);
