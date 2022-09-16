import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { Acl } from 'app/interfaces/acl.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { PermissionsCardStore } from 'app/pages/datasets/modules/permissions/stores/permissions-card.store';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-permissions-card',
  templateUrl: 'permissions-card.component.html',
  styleUrls: ['./permissions-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsCardComponent implements OnInit, OnChanges {
  @Input() dataset: DatasetDetails;

  isLoading: boolean;
  stat: FileSystemStat;
  acl: Acl;

  readonly AclType = AclType;

  constructor(
    private store: PermissionsCardStore,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) {}

  get editPermissionsUrl(): string[] {
    if (this.acl.trivial) {
      return ['/datasets', this.dataset.id, 'permissions', 'edit'];
    }

    return ['/datasets', this.dataset.id, 'permissions', 'acl'];
  }

  get canEditPermissions(): boolean {
    return this.acl && !isRootDataset(this.dataset) && !this.dataset.locked;
  }

  ngOnInit(): void {
    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (state) => {
          this.isLoading = state.isLoading;
          this.acl = state.acl;
          this.stat = state.stat;

          // TODO: Move elsewhere
          if (this.acl && this.acl.acl && this.acl.acltype === AclType.Nfs4) {
            for (const acl of this.acl.acl) {
              if (acl.tag === NfsAclTag.Owner && acl.who === null) {
                acl.who = this.acl.uid.toString();
              }
              if ((acl.tag === NfsAclTag.Group || acl.tag === NfsAclTag.UserGroup) && acl.who === null) {
                acl.who = this.acl.gid.toString();
              }
            }
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.dialogService.errorReportMiddleware(error);
        },
      });
  }

  ngOnChanges(): void {
    this.store.loadPermissions(this.dataset.mountpoint);
  }
}
