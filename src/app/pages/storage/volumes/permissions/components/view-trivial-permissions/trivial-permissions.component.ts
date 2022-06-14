import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { parseApiMode } from 'app/helpers/mode.helper';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/storage/volumes/permissions/interfaces/permission-item.interface';
import { posixPermissionsToDescription } from 'app/pages/storage/volumes/permissions/utils/permissions-to-description.utils';

@Component({
  selector: 'ix-old-trivial-permissions',
  templateUrl: 'trivial-permissions.component.html',
  styleUrls: ['./trivial-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrivialPermissionsComponent {
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
        name: stat.user === null ? 'User - ' + stat.uid.toString() : stat.user,
        description: posixPermissionsToDescription(this.translate, permissions.owner),
      },
      {
        type: PermissionsItemType.Group,
        name: stat.group === null ? 'Group - ' + stat.gid.toString() : stat.group,
        description: posixPermissionsToDescription(this.translate, permissions.group),
      },
      {
        type: PermissionsItemType.Other,
        name: this.translate.instant('Other'),
        description: posixPermissionsToDescription(this.translate, permissions.other),
      },
    ];
  }
}
