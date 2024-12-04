import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { parseApiMode } from 'app/helpers/mode.helper';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { PermissionsItemComponent } from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import {
  posixPermissionsToDescription,
} from 'app/pages/datasets/modules/permissions/utils/permissions-to-description.utils';

@Component({
  selector: 'ix-view-trivial-permissions',
  templateUrl: 'view-trivial-permissions.component.html',
  styleUrls: ['./view-trivial-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [PermissionsItemComponent, TranslateModule],
})
export class ViewTrivialPermissionsComponent {
  readonly stat = input.required<FileSystemStat>();

  readonly permissionItems = computed(() => {
    return this.statToPermissionItems(this.stat());
  });

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
