import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { PosixAclTag } from 'app/enums/posix-acl.enum';
import { Acl, NfsAclItem, PosixAclItem } from 'app/interfaces/acl.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PermissionsItemComponent } from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import { PermissionItem } from 'app/pages/datasets/modules/permissions/interfaces/permission-item.interface';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { nfsAceToPermissionItem } from 'app/pages/datasets/modules/permissions/utils/nfs-ace-to-permission-item.utils';
import {
  posixAceToPermissionItem,
} from 'app/pages/datasets/modules/permissions/utils/posix-ace-to-permission-item.utils';

@Component({
  selector: 'ix-acl-editor-list',
  templateUrl: 'acl-editor-list.component.html',
  styleUrls: ['./acl-editor-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PermissionsItemComponent,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
  ],
})
export class AclEditorListComponent implements OnChanges {
  @Input() acl: Acl;
  @Input() selectedAceIndex: number;
  @Input() acesWithError: number[];
  @Input() owner: string;
  @Input() ownerGroup: string;

  permissionItems: PermissionItem[] = [];
  aces: (NfsAclItem | PosixAclItem)[] = [];

  constructor(
    private store: DatasetAclEditorStore,
    private translate: TranslateService,
  ) {
  }

  ngOnChanges(): void {
    this.aces = this.acl.acl;
    if (this.acl.acltype === AclType.Nfs4) {
      this.permissionItems = this.acl.acl.map((ace) => {
        if (ace.tag === NfsAclTag.Owner) {
          return nfsAceToPermissionItem(this.translate, { ...ace, who: this.owner });
        }
        if (ace.tag === NfsAclTag.Group) {
          return nfsAceToPermissionItem(this.translate, { ...ace, who: this.ownerGroup });
        }

        return nfsAceToPermissionItem(this.translate, ace);
      });
    } else {
      this.permissionItems = this.acl.acl.map((ace) => {
        if (ace.tag === PosixAclTag.UserObject) {
          return posixAceToPermissionItem(this.translate, { ...ace, who: this.owner });
        }
        if (ace.tag === PosixAclTag.GroupObject) {
          return posixAceToPermissionItem(this.translate, { ...ace, who: this.ownerGroup });
        }

        return posixAceToPermissionItem(this.translate, ace);
      });
    }
  }

  /**
   * POSIX acl must have at least one of each: USER_OBJ, GROUP_OBJ and OTHER.
   */
  canBeRemoved(aceToRemove: NfsAclItem | PosixAclItem): boolean {
    if (this.acl.acltype === AclType.Nfs4) {
      return true;
    }

    let hasAnotherUserObj = false;
    let hasAnotherGroupObj = false;
    let hasAnotherOtherAce = false;
    this.acl.acl.forEach((ace) => {
      if (ace === aceToRemove) {
        return;
      }

      if (ace.tag === PosixAclTag.UserObject) {
        hasAnotherUserObj = true;
      }
      if (ace.tag === PosixAclTag.GroupObject) {
        hasAnotherGroupObj = true;
      }
      if (ace.tag === PosixAclTag.Other) {
        hasAnotherOtherAce = true;
      }
    });

    return hasAnotherUserObj && hasAnotherGroupObj && hasAnotherOtherAce;
  }

  onRemoveAcePressed(index: number): void {
    this.store.removeAce(index);
  }

  onAceSelected(index: number): void {
    this.store.selectAce(null);
    setTimeout(() => this.store.selectAce(index));
  }
}
