import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Acl } from 'app/interfaces/acl.interface';
import { PermissionItem } from 'app/pages/storage/volumes/permissions-sidebar/interfaces/permission-item.interface';

@Component({
  selector: 'app-acl-permissions',
  templateUrl: 'acl-permissions.component.html',
  styleUrls: ['./acl-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AclPermissionsComponent {
  @Input() acl: Acl;

  permissionItems: PermissionItem[] = [];
}
