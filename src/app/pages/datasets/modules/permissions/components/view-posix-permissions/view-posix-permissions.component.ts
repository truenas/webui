import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PosixAcl } from 'app/interfaces/acl.interface';
import { PermissionItem } from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import {
  posixAceToPermissionItem,
} from 'app/pages/datasets/modules/permissions/utils/posix-ace-to-permission-item.utils';

@Component({
  selector: 'ix-view-posix-permissions',
  templateUrl: 'view-posix-permissions.component.html',
  styleUrls: ['./view-posix-permissions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPosixPermissionsComponent implements OnChanges {
  @Input() acl: PosixAcl;

  permissionItems: PermissionItem[] = [];

  constructor(
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.transformAcl();
  }

  private transformAcl(): void {
    this.permissionItems = this.acl.acl.map((ace) => posixAceToPermissionItem(this.translate, ace));
  }
}
