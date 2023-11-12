import {
  ChangeDetectorRef,
  Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

const roleMapping = {
  [Role.SharingIscsiExtentWrite]: [Role.SharingIscsiExtentWrite, Role.SharingIscsiExtentRead],
  [Role.SharingNfsWrite]: [Role.SharingNfsWrite, Role.SharingNfsRead],
  [Role.FullAdmin]: [Role.FullAdmin, Role.DatasetDelete],
  [Role.SharingSmbWrite]: [Role.SharingSmbWrite, Role.SharingSmbRead],
  [Role.SharingRead]: [Role.SharingRead, Role.SharingIscsiExtentRead, Role.SharingNfsRead, Role.SharingSmbRead],
  [Role.SharingWrite]: [Role.SharingWrite, Role.SharingIscsiExtentWrite, Role.SharingNfsWrite, Role.SharingSmbWrite],
  [Role.KeychainCredentialWrite]: [Role.KeychainCredentialWrite, Role.KeychainCredentialRead],
  [Role.ReplicationTaskConfigWrite]: [Role.ReplicationTaskConfigWrite, Role.ReplicationTaskConfigRead],
  [Role.ReplicationTaskWrite]: [Role.ReplicationTaskWrite, Role.ReplicationTaskRead],
  [Role.ReplicationTaskWritePull]: [Role.ReplicationTaskWritePull, Role.ReplicationTaskWrite],
  [Role.SnapshotTaskWrite]: [Role.SnapshotTaskWrite, Role.SnapshotTaskRead],
  [Role.DatasetWrite]: [Role.DatasetWrite, Role.DatasetRead],
  [Role.SnapshotWrite]: [Role.SnapshotWrite, Role.SnapshotRead],
  [Role.ReplicationManager]: [
    Role.ReplicationManager,
    Role.KeychainCredentialWrite,
    Role.ReplicationTaskConfigWrite,
    Role.ReplicationTaskWrite,
    Role.SnapshotTaskWrite,
    Role.SnapshotWrite,
  ],
  [Role.SharingManager]: [Role.SharingManager, Role.DatasetWrite, Role.SharingWrite],
} as { [key in Role]: Role[] };

@UntilDestroy()
@Directive({ selector: '[ixIfUserHasRoles]' })
export class IfUserHasRolesDirective {
  private currentUserRoles: Role[] = [];

  @Input() set ixIfUserHasRoles(roles: Role[]) {
    this.viewContainer.clear();

    if (this.checkRoles(roles)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
  ) {
    this.authService.user$.pipe(untilDestroyed(this)).subscribe(user => {
      this.currentUserRoles = user.roles?.flatMap((role) => roleMapping[role] || role);
      this.cdr.markForCheck();
    });
  }

  private checkRoles(roles: Role[]): boolean {
    return roles.every(role => this.currentUserRoles.includes(role));
  }
}
