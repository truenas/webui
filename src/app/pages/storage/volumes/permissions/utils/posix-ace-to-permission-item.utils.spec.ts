import { fakeTranslateService } from 'app/core/testing/classes/fake-translate.service';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAclItem, PosixPermissions } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions/interfaces/permission-item.interface';
import { posixAceToPermissionItem } from 'app/pages/storage/volumes/permissions/utils/posix-ace-to-permission-item.utils';

describe('posixAceToPermissionItem', () => {
  const perms = {
    [PosixPermission.Read]: true,
    [PosixPermission.Write]: false,
    [PosixPermission.Execute]: true,
  } as PosixPermissions;

  it('converts user ace to permission item', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.User, who: 'john', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User – john',
      type: PermissionsItemType.User,
    });
  });

  it('converts owner ace to permission item with name when default is false', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.UserObject, who: 'john', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User Obj – john',
      type: PermissionsItemType.User,
    });
  });

  it('converts group ace to permission item', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Group, who: 'johns', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Group – johns',
      type: PermissionsItemType.Group,
    } as PermissionItem);
  });

  it('converts owner group ace to permission item with name when default is false', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.GroupObject, who: 'johns', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Group Obj – johns',
      type: PermissionsItemType.Group,
    } as PermissionItem);
  });

  it('converts mask ace to permission item', () => {
    const expected = {
      description: 'Read | Execute',
      name: 'Mask',
      type: PermissionsItemType.Group,
    } as PermissionItem;

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Mask, perms } as PosixAclItem,
    )).toStrictEqual(expected);
  });

  it('converts others ace to permission item when default is false', () => {
    const expected = {
      description: 'Read | Execute',
      name: 'Other',
      type: PermissionsItemType.Other,
    } as PermissionItem;

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Other, perms } as PosixAclItem,
    )).toStrictEqual(expected);
  });

  it('handles default entries differently', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      {
        tag: PosixAclTag.UserObject, who: 'john', perms, default: true,
      } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User Obj (default)',
      type: PermissionsItemType.User,
    });

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      {
        tag: PosixAclTag.GroupObject, who: 'johns', perms, default: true,
      } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Group Obj (default)',
      type: PermissionsItemType.Group,
    });

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Other, perms, default: true } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Other (default)',
      type: PermissionsItemType.Other,
    });
  });
});
