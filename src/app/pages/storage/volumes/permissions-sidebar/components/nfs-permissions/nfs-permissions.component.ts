import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  NfsAclTag, nfsAclTagLabels, nfsAclTypeLabels, NfsAdvancedFlag, nfsAdvancedFlagLabels,
  NfsAdvancedPermission, nfsAdvancedPermissionLabels, nfsBasicFlagLabels, nfsBasicPermissionLabels,
} from 'app/enums/nfs-acl.enum';
import {
  NfsAcl, NfsAclItem,
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
    let name = this.translate.instant(nfsAclTagLabels.get(ace.tag));

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

    const access = this.translate.instant(nfsAclTypeLabels.get(ace.type));
    let action = this.translate.instant('Special');
    if ('BASIC' in ace.perms) {
      action = this.translate.instant(nfsBasicPermissionLabels.get(ace.perms.BASIC));
    } else {
      const permissions = Object.keys(ace.perms) as NfsAdvancedPermission[];
      if (permissions.length === 1) {
        action = this.translate.instant(nfsAdvancedPermissionLabels.get(permissions[0]));
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
    let arePermissionsBasic: boolean;
    let permissions: string[];

    if ('BASIC' in ace.perms) {
      arePermissionsBasic = true;
      permissions = [this.translate.instant(nfsBasicPermissionLabels.get(ace.perms.BASIC))];
    } else {
      arePermissionsBasic = false;
      permissions = Object.entries(ace.perms)
        .filter(([_, isOn]) => isOn)
        .map(([permission]) => {
          return this.translate.instant(nfsAdvancedPermissionLabels.get(permission as NfsAdvancedPermission));
        });
    }

    // Flags
    let areFlagsBasic: boolean;
    let flags: string[];

    if ('BASIC' in ace.flags) {
      areFlagsBasic = true;
      flags = [this.translate.instant(nfsBasicFlagLabels.get(ace.flags.BASIC))];
    } else {
      areFlagsBasic = false;
      flags = Object.entries(ace.flags)
        .filter(([_, isOn]) => isOn)
        .map(([flag]) => {
          return this.translate.instant(nfsAdvancedFlagLabels.get(flag as NfsAdvancedFlag));
        });
    }

    return {
      flags,
      permissions,
      areFlagsBasic,
      arePermissionsBasic,
    };
  }
}
