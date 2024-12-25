import { TranslateService } from '@ngx-translate/core';
import {
  NfsAclTag,
  nfsAclTagLabels,
  nfsAclTypeLabels,
  NfsAdvancedPermission, nfsAdvancedPermissionLabels,
  nfsBasicPermissionLabels,
} from 'app/enums/nfs-acl.enum';
import { areNfsPermissionsBasic, NfsAclItem } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import { getAceWhoString } from 'app/pages/datasets/modules/permissions/utils/get-ace-who-string.utils';

export function nfsAceToPermissionItem(translate: TranslateService, ace: NfsAclItem): PermissionItem {
  let name = translate.instant(nfsAclTagLabels.get(ace.tag) || ace.tag);

  let type: PermissionsItemType;
  switch (ace.tag) {
    case NfsAclTag.User:
    case NfsAclTag.Owner:
      type = PermissionsItemType.User;
      name = `${name} - ${getAceWhoString(ace)}`;
      break;
    case NfsAclTag.Group:
    case NfsAclTag.UserGroup:
      type = PermissionsItemType.Group;
      name = `${name} - ${getAceWhoString(ace)}`;
      break;
    default:
      type = PermissionsItemType.Other;
  }

  const access = translate.instant(nfsAclTypeLabels.get(ace.type) || ace.type);
  let action = translate.instant('Special');
  if (areNfsPermissionsBasic(ace.perms)) {
    action = translate.instant(nfsBasicPermissionLabels.get(ace.perms.BASIC) || ace.perms.BASIC);
  } else {
    const permissions = Object.keys(ace.perms) as NfsAdvancedPermission[];
    if (permissions.length === 1) {
      action = translate.instant(nfsAdvancedPermissionLabels.get(permissions[0]) || permissions[0]);
    }
  }

  return {
    type,
    name,
    description: `${access} | ${action}`,
  };
}
