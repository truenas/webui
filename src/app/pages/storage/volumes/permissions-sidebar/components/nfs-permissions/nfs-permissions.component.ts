import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  getNfsAclTagLabels,
  getNfsAclTypeLabels, getNfsAdvancedFlagLabels, getNfsAdvancedPermissionLabels, getNfsBasicFlagLabels,
  getNfsBasicPermissionLabels,
  NfsAclTag, NfsAdvancedFlag,
  NfsAdvancedPermission,
} from 'app/enums/nfs-acl.enum';
import {
  BasicNfsFlags, BasicNfsPermissions, NfsAcl, NfsAclItem,
} from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';

interface PermissionDetails {
  arePermissionsBasic: boolean;
  permissions: string[];

  areFlagsBasic: boolean;
  flags: string[];
}

@Component({
  selector: 'app-nfs-permissions',
  templateUrl: 'nfs-permissions.component.html',
  styleUrls: ['./nfs-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsPermissionsComponent implements OnChanges {
  @Input() acl: NfsAcl;

  permissionItems: PermissionItem[] = [];
  permissionDetails: PermissionDetails[] = [];

  constructor(
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.transformAcl();
  }

  private transformAcl(): void {
    this.permissionItems = [];
    this.permissionDetails = [];

    this.acl.acl.forEach((ace) => {
      this.permissionItems.push(this.aceToPermissionItem(ace));
      this.permissionDetails.push(this.aceToPermissionDetails(ace));
    });
  }

  private aceToPermissionItem(ace: NfsAclItem): PermissionItem {
    const labels = getNfsAclTagLabels(this.translate);
    let name = labels.get(ace.tag);

    let type: PermissionsItemType;
    switch (ace.tag) {
      case NfsAclTag.User:
      case NfsAclTag.Owner:
        type = PermissionsItemType.User;
        name = `${name} - ${ace.who || '?'}`;
        break;
      case NfsAclTag.Group:
      case NfsAclTag.UserGroup:
        type = PermissionsItemType.Group;
        name = `${name} - ${ace.who || '?'}`;
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
      name,
      description: `${access} | ${action}`,
    };
  }

  private aceToPermissionDetails(ace: NfsAclItem): PermissionDetails {
    // Permissions
    const arePermissionsBasic = 'BASIC' in ace.perms;
    let permissions: string[];

    if (arePermissionsBasic) {
      const basicPermissionLabels = getNfsBasicPermissionLabels(this.translate);
      permissions = [basicPermissionLabels.get((ace.perms as BasicNfsPermissions).BASIC)];
    } else {
      const advancedPermissionLabels = getNfsAdvancedPermissionLabels(this.translate);
      permissions = Object.entries(ace.perms)
        .filter(([_, isOn]) => isOn)
        .map(([permission]) => advancedPermissionLabels.get(permission as NfsAdvancedPermission));
    }

    // Flags
    const areFlagsBasic = 'BASIC' in ace.flags;
    let flags: string[];

    if (areFlagsBasic) {
      const basicFlagLabels = getNfsBasicFlagLabels(this.translate);
      flags = [basicFlagLabels.get((ace.flags as BasicNfsFlags).BASIC)];
    } else {
      const advancedFlagLabels = getNfsAdvancedFlagLabels(this.translate);
      flags = Object.entries(ace.flags)
        .filter(([_, isOn]) => isOn)
        .map(([flag]) => advancedFlagLabels.get(flag as NfsAdvancedFlag));
    }

    return {
      flags,
      permissions,
      areFlagsBasic,
      arePermissionsBasic,
    };
  }
}
