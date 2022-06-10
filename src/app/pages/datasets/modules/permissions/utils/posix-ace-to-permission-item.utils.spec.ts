import { fakeTranslateService } from 'app/core/testing/classes/fake-translate.service';
import { PosixAclTag, PosixPermission } from 'app/enums/posix-acl.enum';
import { PosixAclItem, PosixPermissions } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import { posixAceToPermissionItem } from './posix-ace-to-permission-item.utils';

describe('posixAceToPermissionItem', () => {
  const perms = {
    [PosixPermission.Read]: true,
    [PosixPermission.Write]: false,
    [PosixPermission.Execute]: true,
  } as PosixPermissions;

  it('converts user aces to permission items', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.User, who: 'john', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User – john',
      type: PermissionsItemType.User,
    });

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.UserObject, who: 'john', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User Obj – john',
      type: PermissionsItemType.User,
    });
  });

  it('converts group aces to permission items', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Group, who: 'johns', perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Group – johns',
      type: PermissionsItemType.Group,
    } as PermissionItem);

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

  it('converts others ace to permission item', () => {
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

  it('adds a `default` keyword when default flag is on', () => {
    expect(posixAceToPermissionItem(
      fakeTranslateService,
      {
        tag: PosixAclTag.Group, who: 'johns', default: true, perms,
      } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Group – default – johns',
      type: PermissionsItemType.Group,
    } as PermissionItem);

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      {
        tag: PosixAclTag.UserObject, who: 'john', default: true, perms,
      } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'User Obj – default – john',
      type: PermissionsItemType.User,
    });

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Mask, default: true, perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Mask – default',
      type: 'group',
    });

    expect(posixAceToPermissionItem(
      fakeTranslateService,
      { tag: PosixAclTag.Other, default: true, perms } as PosixAclItem,
    )).toStrictEqual({
      description: 'Read | Execute',
      name: 'Other – default',
      type: 'other',
    });
  });
});
