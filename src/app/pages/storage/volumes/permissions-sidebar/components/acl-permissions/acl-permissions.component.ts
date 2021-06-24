import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  AclType
} from 'app/enums/acl-type.enum';
import {
  getNfsAclTypeLabels, getNfsAdvancedFlagLabels,
  getNfsAdvancedPermissionLabels, getNfsBasicFlagLabels,
  getNfsBasicPermissionLabels, NfsAclTag, NfsAdvancedFlag,
  NfsAdvancedPermission, NfsBasicFlag, NfsBasicPermission
} from 'app/enums/nfs-acl.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import { Acl, BasicNfsPermissions, NfsAclItem, PosixAclItem } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';
import { posixPermissionsToDescription } from 'app/pages/storage/volumes/permissions-sidebar/utils/permissions-to-description.utils';

interface PermissionDetails {
  arePermissionsAdvanced: boolean;
  permissions: string[];

  areFlagsAdvanced: boolean;
  flags: string[];
}

@Component({
  selector: 'app-acl-permissions',
  templateUrl: 'acl-permissions.component.html',
  styleUrls: ['./acl-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AclPermissionsComponent implements OnChanges {
  @Input() acl: Acl;

  permissionItems: PermissionItem[] = [];
  permissionDetails: PermissionDetails[] = [];

  constructor(
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.transformAcl();
  }

  private transformAcl(): void {
    const isNfsAcl = this.acl.acltype === AclType.Nfs4;
    // TODO: unknown casting not needed in Typescript 4.3
    this.permissionItems = (this.acl.acl as unknown[]).map((aclItem) => {
      if (isNfsAcl) {
        return this.nfsAceToPermissionItem(aclItem as NfsAclItem);
      }

      return this.posixAceToPermissionItem(aclItem as PosixAclItem);
    });

    this.permissionDetails = (this.acl.acl as unknown[]).map((aclItem) => {
      if (isNfsAcl) {
        return this.nfsAceToPermissionDetails(aclItem as NfsAclItem);
      }

      return this.posixAceToPermissionDetails(aclItem as PosixAclItem);
    });
  }

  private nfsAceToPermissionItem(ace: NfsAclItem): PermissionItem {
    let type: PermissionsItemType;
    switch (ace.tag) {
      case NfsAclTag.User:
      case NfsAclTag.Owner:
        type = PermissionsItemType.User;
        break;
      case NfsAclTag.Group:
      case NfsAclTag.UserGroup:
        type = PermissionsItemType.Group;
        break;
      default:
        type = PermissionsItemType.Other;
    }

    const access = getNfsAclTypeLabels(this.translate).get(ace.type);
    let action = this.translate.instant('Special');
    if ('BASIC' in ace.perms) {
      action = getNfsBasicPermissionLabels(this.translate).get(ace.perms.BASIC);
    } else {
      const permissions = Object.keys(ace.perms) as NfsAdvancedPermission[];
      if (permissions.length === 1) {
        action = getNfsAdvancedPermissionLabels(this.translate).get(permissions[0]);
      }
    }

    return {
      type,
      name: ace.tag,
      description: `${access} | ${action}`,
    };
  }

  private posixAceToPermissionItem(ace: PosixAclItem): PermissionItem {
    let type: PermissionsItemType;
    switch (ace.tag) {
      case PosixAclTag.User:
      case PosixAclTag.UserObject:
        type = PermissionsItemType.User;
        break;
      case PosixAclTag.Group:
      case PosixAclTag.GroupObject:
      case PosixAclTag.Mask:
        type = PermissionsItemType.Group;
        break;
      default:
        type = PermissionsItemType.Other;
    }

    return {
      type,
      name: ace.tag, // TODO: Support for user name and group.
      description: posixPermissionsToDescription(this.translate, ace.perms),
    };
  }

  private posixAceToPermissionDetails(ace: PosixAclItem): PermissionDetails {
    const permissions = ''; // TODO: Fuck

    return {
      permissions,
      flags: [],
      arePermissionsAdvanced: false,
      areFlagsAdvanced: false,
    };
  }

  private nfsAceToPermissionDetails(ace: NfsAclItem): PermissionDetails {
    // Permissions
    const basicPermissionLabels = getNfsBasicPermissionLabels(this.translate);
    const advancedPermissionLabels = getNfsAdvancedPermissionLabels(this.translate);
    const permissions = Object.entries(ace.perms)
      .filter(([_, isOn]) => isOn)
      .map(([permission]) => {
        return basicPermissionLabels.get(permission as NfsBasicPermission)
          || advancedPermissionLabels.get(permission as NfsAdvancedPermission);
      });

    // Flags
    const basicFlagLabels = getNfsBasicFlagLabels(this.translate);
    const advancedFlagLabels = getNfsAdvancedFlagLabels(this.translate);
    const flags = Object.entries(ace.flags)
      .filter(([_, isOn]) => isOn)
      .map(([flag]) => {
        return basicFlagLabels.get(flag as NfsBasicFlag) || advancedFlagLabels.get(flag as NfsAdvancedFlag);
      });

    return {
      flags,
      permissions,
      arePermissionsAdvanced: !('BASIC' in ace),
      areFlagsAdvanced: !('BASIC' in (ace as NfsAclItem).flags),
    };
  }
}
