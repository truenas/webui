import {
  ChangeDetectionStrategy, Component, Input, EventEmitter, Output,
} from '@angular/core';

@Component({
  selector: 'app-view-permissions-sidebar',
  templateUrl: 'view-permissions-sidebar.component.html',
  styleUrls: ['./view-permissions-sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewPermissionsSidebarComponent {
  @Input() mountpoint: string;

  @Output() closed = new EventEmitter<void>();

  get editPermissionsUrl(): string {
    return '';
  }

  onCloseClicked(): void {
    this.closed.emit();
  }
}

/**
this.ws.call('filesystem.acl_is_trivial', [rowData.mountpoint])
 .pipe(untilDestroyed(this)).subscribe((acl_is_trivial) => {
              if (acl_is_trivial) {
                this.router.navigate(new Array('/').concat([
                  'storage', 'permissions', rowData.id,
                ]));
              } else {
                this.ws.call('filesystem.getacl', [rowData.mountpoint]).pipe(untilDestroyed(this)).subscribe((acl) => {
                  if (acl.acltype === AclType.Posix1e) {
                    this.router.navigate(new Array('/').concat([
                      'storage', 'id', rowData.pool, 'dataset',
                      'posix-acl', rowData.id,
                    ]));
                  } else {
                    this.router.navigate(new Array('/').concat([
                      'storage', 'id', rowData.pool, 'dataset',
                      'acl', rowData.id,
                    ]));
                  }
                });
              }
            });
 */
