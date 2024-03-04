import {
  Directive, HostBinding, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEqual } from 'lodash';
import { HasAccessDirective } from 'app/directives/common/has-access/has-access.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixRequiresRoles]',
})
export class RequiresRolesDirective extends HasAccessDirective {
  private previousRoles: Role[] = [];

  @Input()
  set ixRequiresRoles(roles: Role[]) {
    if (isEqual(this.previousRoles, roles)) {
      return;
    }

    this.previousRoles = roles;

    if (!roles?.length) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }
    this.authService.hasRole(roles).pipe(untilDestroyed(this)).subscribe({
      next: (hasRole) => {
        this.ixHasAccess = hasRole;
      },
    });
  }

  protected cssClassList: string[] = [];

  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
    return this.cssClassList.join(' ');
  }
  set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }

  constructor(
    protected templateRef: TemplateRef<unknown>,
    protected viewContainerRef: ViewContainerRef,
    private authService: AuthService,
  ) {
    super(templateRef, viewContainerRef);
  }
}
