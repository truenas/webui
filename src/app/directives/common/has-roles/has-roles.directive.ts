import {
  ChangeDetectorRef,
  Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({ selector: '[ixHasRoles]' })
export class HasRolesDirective {
  private currentUserRoles: Role[] = [];

  @Input() set ixHasRoles(roles: Role[]) {
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
    this.authService.user$.pipe(untilDestroyed(this)).subscribe((user) => {
      this.currentUserRoles = user?.privilege?.roles?.$set || [];
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

    return roles.some((role) => this.currentUserRoles.includes(role));
  }
}
