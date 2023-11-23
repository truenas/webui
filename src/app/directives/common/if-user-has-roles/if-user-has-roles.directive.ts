import {
  ChangeDetectorRef,
  Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

// Key in this Map will be auto included in the values array
// example: [Role.SomeRole]: [Role.DatasetDelete] => [Role.SomeRole]: [Role.DatasetDelete, Role.SomeRole]
const specificRoleMapping = {
  [Role.SharingRead]: [Role.SharingIscsiExtentRead, Role.SharingNfsRead, Role.SharingSmbRead],
  [Role.SharingWrite]: [Role.SharingIscsiExtentWrite, Role.SharingNfsWrite, Role.SharingSmbWrite],
  [Role.ReplicationManager]: [
    Role.KeychainCredentialWrite,
    Role.ReplicationTaskConfigWrite,
    Role.ReplicationTaskWrite,
    Role.SnapshotTaskWrite,
    Role.SnapshotWrite,
  ],
  [Role.SharingManager]: [Role.DatasetWrite, Role.SharingWrite],
  [Role.FilesystemFullControl]: [Role.FilesystemDataWrite, Role.FilesystemAttrsWrite],
} as { [key in Role]: Role[] };

// Function to check if a role is a 'Write' role
function isWriteRole(role: Role): boolean {
  return role.toString().endsWith('_WRITE');
}

// Function to get corresponding 'Read' role for a 'Write' role
function getReadRoleForWriteRole(writeRole: Role): Role | undefined {
  const readRoleString = writeRole.toString().replace('_WRITE', '_READ');

  // Use Object.keys to iterate over the Role enum
  const keys = Object.keys(Role) as (keyof typeof Role)[];
  for (const key of keys) {
    if (Role[key] === readRoleString) {
      return Role[key];
    }
  }

  return undefined;
}

// Recursive function to resolve roles
function resolveRoles(inputRoles: Role[]): Role[] {
  const resolvedRoles: Role[] = [];
  const processedRoles = new Set<Role>();

  function resolve(role: Role): void {
    if (processedRoles.has(role)) {
      return;
    }

    processedRoles.add(role);
    resolvedRoles.push(role);

    if (isWriteRole(role)) {
      const readRole = getReadRoleForWriteRole(role);
      if (readRole && !processedRoles.has(readRole)) {
        resolve(readRole);
      }
    }

    const includedRoles = specificRoleMapping[role];
    if (includedRoles) {
      includedRoles.forEach(includedRole => {
        if (!processedRoles.has(includedRole)) {
          resolve(includedRole);
        }
      });
    }
  }

  inputRoles?.forEach(role => {
    if (!processedRoles.has(role)) {
      resolve(role);
    }
  });

  return resolvedRoles;
}

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
      this.currentUserRoles = resolveRoles(user.roles);
      this.cdr.markForCheck();
    });
  }

  private checkRoles(roles: Role[]): boolean {
    if (!roles?.length || !this.currentUserRoles?.length) {
      return false;
    }

    if (this.currentUserRoles.includes(Role.FullAdmin)) {
      return true;
    }

    return roles.every(role => this.currentUserRoles.includes(role));
  }
}
