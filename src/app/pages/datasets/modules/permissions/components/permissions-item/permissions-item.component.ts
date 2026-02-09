import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';
import {
  PermissionItem,
  PermissionsItemType,
} from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';

@Component({
  selector: 'ix-permissions-item',
  templateUrl: 'permissions-item.component.html',
  styleUrls: ['./permissions-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent],
})
export class PermissionsItemComponent {
  readonly item = input.required<PermissionItem>();

  readonly PermissionsItem = PermissionsItemType;
}
