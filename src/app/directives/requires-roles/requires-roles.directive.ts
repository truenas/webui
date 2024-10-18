import {
  Directive, HostBinding, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { isEqual } from 'lodash-es';
import { take } from 'rxjs';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Directive({
  selector: '[ixRequiresRoles]',
  standalone: true,
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

    this.authService
      .hasRole(roles)
      .pipe(take(1), untilDestroyed(this))
      .subscribe((hasRole) => this.ixHasAccess = hasRole);
  }

  protected override cssClassList: string[] = [];

  @Input('class')
  @HostBinding('class')
  override get elementClass(): string {
    return this.cssClassList.join(' ');
  }

  override set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }

  constructor(
    protected override templateRef: TemplateRef<HTMLElement>,
    protected override viewContainerRef: ViewContainerRef,
    private authService: AuthService,
  ) {
    super(templateRef, viewContainerRef);
  }
}
