import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { getPosixAclTagLabels, PosixAclTag } from 'app/enums/posix-acl.enum';
import { PosixAcl, PosixAclItem } from 'app/interfaces/acl.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';
import { posixPermissionsToDescription } from 'app/pages/storage/volumes/permissions-sidebar/utils/permissions-to-description.utils';

@Component({
  selector: 'app-posix-permissions',
  templateUrl: 'posix-permissions.component.html',
  styleUrls: ['./posix-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosixPermissionsComponent implements OnChanges {
  @Input() acl: PosixAcl;

  permissionItems: PermissionItem[] = [];

  constructor(
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.transformAcl();
  }

  private transformAcl(): void {
    this.permissionItems = this.acl.acl.map((ace) => this.posixAceToPermissionItem(ace));
  }

  private posixAceToPermissionItem(ace: PosixAclItem): PermissionItem {
    const labels = getPosixAclTagLabels(this.translate);
    let name = labels.get(ace.tag);

    let type: PermissionsItemType;
    switch (ace.tag) {
      case PosixAclTag.User:
      case PosixAclTag.UserObject:
        type = PermissionsItemType.User;
        name = `${name} – ${ace.who || '?'}`;
        break;
      case PosixAclTag.Group:
      case PosixAclTag.GroupObject:
        type = PermissionsItemType.Group;
        name = `${name} - ${ace.who || '?'}`;
        break;
      case PosixAclTag.Mask:
        type = PermissionsItemType.Group;
        break;
      default:
        type = PermissionsItemType.Other;
    }

    return {
      type,
      name,
      description: posixPermissionsToDescription(this.translate, ace.perms),
    };
  }
}
