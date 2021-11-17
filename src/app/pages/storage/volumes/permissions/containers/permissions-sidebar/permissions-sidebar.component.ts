import {
  ChangeDetectionStrategy, Component, Input, EventEmitter, Output, OnChanges, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AclType } from 'app/enums/acl-type.enum';
import { Acl } from 'app/interfaces/acl.interface';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { PermissionsSidebarStore } from 'app/pages/storage/volumes/permissions/stores/permissions-sidebar.store';

@UntilDestroy()
@Component({
  selector: 'app-permissions-sidebar',
  templateUrl: 'permissions-sidebar.component.html',
  styleUrls: ['./permissions-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsSidebarComponent implements OnInit, OnChanges {
  @Input() dataset: Pick<Dataset, 'id' | 'pool' | 'mountpoint'>;

  @Output() closed = new EventEmitter<void>();

  isLoading: boolean;
  stat: FileSystemStat;
  acl: Acl;

  readonly AclType = AclType;

  constructor(
    private store: PermissionsSidebarStore,
    private cdr: ChangeDetectorRef,
  ) {}

  get editPermissionsUrl(): string[] {
    if (this.acl.trivial) {
      return ['/storage/permissions', this.dataset.id];
    }

    if (this.acl.acltype === AclType.Posix1e) {
      return ['/storage/id', this.dataset.pool, 'dataset', 'posix-acl', this.dataset.id];
    }

    return ['/storage/id', this.dataset.pool, 'dataset', 'acl', this.dataset.id];
  }

  get canEditPermissions(): boolean {
    const isRootDataset = (this.dataset.mountpoint.match(/\//g) || []).length <= 2;
    return this.acl && !isRootDataset;
  }

  ngOnInit(): void {
    this.store.state$
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.isLoading = state.isLoading;
        this.acl = state.acl;
        this.stat = state.stat;
        this.cdr.markForCheck();
      });
  }

  ngOnChanges(): void {
    this.store.loadPermissions(this.dataset.mountpoint);
  }

  onCloseClicked(): void {
    this.closed.emit();
  }
}
