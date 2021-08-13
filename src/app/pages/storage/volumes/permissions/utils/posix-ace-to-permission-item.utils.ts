import { TranslateService } from '@ngx-translate/core';
import { PosixAclTag, posixAclTagLabels } from 'app/enums/posix-acl.enum';
import { PosixAclItem } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions/interfaces/permission-item.interface';
import { getAceWhoString } from 'app/pages/storage/volumes/permissions/utils/get-ace-who-string.utils';
import { posixPermissionsToDescription } from 'app/pages/storage/volumes/permissions/utils/permissions-to-description.utils';

export function posixAceToPermissionItem(translate: TranslateService, ace: PosixAclItem): PermissionItem {
  let name = translate.instant(posixAclTagLabels.get(ace.tag));

  let type: PermissionsItemType;
  switch (ace.tag) {
    case PosixAclTag.User:
      type = PermissionsItemType.User;
      name = `${name} – ${getAceWhoString(ace)}`;
      break;
    case PosixAclTag.UserObject:
      type = PermissionsItemType.User;
      if (ace.default) {
        name = `${name} (${translate.instant('default')})`;
      } else {
        name = `${name} – ${getAceWhoString(ace)}`;
      }

      break;
    case PosixAclTag.Group:
      type = PermissionsItemType.Group;
      name = `${name} – ${getAceWhoString(ace)}`;
      break;
    case PosixAclTag.GroupObject:
      type = PermissionsItemType.Group;

      if (ace.default) {
        name = `${name} (${translate.instant('default')})`;
      } else {
        name = `${name} – ${getAceWhoString(ace)}`;
      }

      break;
    case PosixAclTag.Mask:
      type = PermissionsItemType.Group;
      break;
    case PosixAclTag.Other:
      type = PermissionsItemType.Other;
      if (ace.default) {
        name = `${name} (${translate.instant('default')})`;
      }

      break;
    default:
      type = PermissionsItemType.Other;
  }

  return {
    type,
    name,
    description: posixPermissionsToDescription(translate, ace.perms),
  };
}
