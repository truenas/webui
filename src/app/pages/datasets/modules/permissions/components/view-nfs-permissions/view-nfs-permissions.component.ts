import { CdkAccordion, CdkAccordionItem } from '@angular/cdk/accordion';
import {
  ChangeDetectionStrategy, Component, input, OnChanges,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  NfsAdvancedFlag, nfsAdvancedFlagLabels,
  NfsAdvancedPermission, nfsAdvancedPermissionLabels, nfsBasicFlagLabels, nfsBasicPermissionLabels,
} from 'app/enums/nfs-acl.enum';
import {
  areNfsFlagsBasic,
  areNfsPermissionsBasic,
  NfsAcl, NfsAclItem,
} from 'app/interfaces/acl.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PermissionsItemComponent } from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import { PermissionItem } from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import { nfsAceToPermissionItem } from 'app/pages/datasets/modules/permissions/utils/nfs-ace-to-permission-item.utils';

interface PermissionDetails {
  arePermissionsBasic: boolean;
  permissions: string[];

  areFlagsBasic: boolean;
  flags: string[];
}

@Component({
  selector: 'ix-view-nfs-permissions',
  templateUrl: 'view-nfs-permissions.component.html',
  styleUrls: ['./view-nfs-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkAccordion,
    CdkAccordionItem,
    PermissionsItemComponent,
    IxIconComponent,
    TranslateModule,
  ],
})
export class ViewNfsPermissionsComponent implements OnChanges {
  readonly acl = input.required<NfsAcl>();

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

    this.acl().acl.forEach((ace) => {
      this.permissionItems.push(nfsAceToPermissionItem(this.translate, ace));
      this.permissionDetails.push(this.aceToPermissionDetails(ace));
    });
  }

  private aceToPermissionDetails(ace: NfsAclItem): PermissionDetails {
    // Permissions
    let arePermissionsBasic: boolean;
    let permissions: string[];

    if (areNfsPermissionsBasic(ace.perms)) {
      arePermissionsBasic = true;
      permissions = [this.translate.instant(nfsBasicPermissionLabels.get(ace.perms.BASIC))];
    } else {
      arePermissionsBasic = false;
      permissions = Object.entries(ace.perms)
        .filter(([, isOn]) => isOn)
        .map(([permission]) => {
          return this.translate.instant(nfsAdvancedPermissionLabels.get(permission as NfsAdvancedPermission));
        });
    }

    // Flags
    let areFlagsBasic: boolean;
    let flags: string[];

    if (areNfsFlagsBasic(ace.flags)) {
      areFlagsBasic = true;
      flags = [this.translate.instant(nfsBasicFlagLabels.get(ace.flags.BASIC))];
    } else {
      areFlagsBasic = false;
      flags = Object.entries(ace.flags)
        .filter(([, isOn]) => isOn)
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
