import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { parseApiMode } from 'app/helpers/mode.helper';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { UnixPermissions } from 'app/interfaces/posix-permissions.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';

@Component({
  selector: 'app-unix-permissions',
  templateUrl: 'unix-permissions.component.html',
  styleUrls: ['./unix-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnixPermissionsComponent {
  @Input()
  set stat(stat: FileSystemStat) {
    this.permissionItems = this.statToPermissionItems(stat);
  }

  permissionItems: PermissionItem[];

  constructor(
    private translate: TranslateService,
  ) {}

  private statToPermissionItems(stat: FileSystemStat): PermissionItem[] {
    const permissions = parseApiMode(stat.mode);

    return [
      {
        type: PermissionsItemType.User,
        name: stat.user,
        permissions: this.permissionsToString(permissions.owner),
      },
      {
        type: PermissionsItemType.Group,
        name: stat.group,
        permissions: this.permissionsToString(permissions.group),
      },
      {
        type: PermissionsItemType.Other,
        name: this.translate.instant('Other'),
        permissions: this.permissionsToString(permissions.other),
      },
    ];
  }

  private permissionsToString(permissions: UnixPermissions): string {
    const allowed: string[] = [];

    if (permissions.read) {
      allowed.push(this.translate.instant('Read'));
    }
    if (permissions.write) {
      allowed.push(this.translate.instant('Write'));
    }
    if (permissions.write) {
      allowed.push(this.translate.instant('Execute'));
    }

    if (!allowed.length) {
      return this.translate.instant('None');
    }

    return allowed.join(' | ');
  }
}
