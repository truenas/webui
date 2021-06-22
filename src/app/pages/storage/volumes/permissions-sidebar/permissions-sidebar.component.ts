import {
  ChangeDetectionStrategy, Component, Input, EventEmitter, Output, OnChanges,
} from '@angular/core';
import { PermissionsSidebarStore } from 'app/pages/storage/volumes/permissions-sidebar/permissions-sidebar.store';

@Component({
  selector: 'app-view-permissions-sidebar',
  templateUrl: 'permissions-sidebar.component.html',
  styleUrls: ['./permissions-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PermissionsSidebarComponent implements OnChanges {
  @Input() mountpoint: string;

  @Output() closed = new EventEmitter<void>();

  get editPermissionsUrl(): string {
    return '';
  }

  constructor(
    private store: PermissionsSidebarStore,
  ) {
  }

  ngOnChanges(): void {
    this.store.loadPermissions(this.mountpoint);
  }

  onCloseClicked(): void {
    this.closed.emit();
  }
}
