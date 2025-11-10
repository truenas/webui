import { DestroyRef, Directive, Input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isEqual } from 'lodash-es';
import { take } from 'rxjs';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

@Directive({
  selector: '[ixRequiresRoles]',
  host: {
    '[class]': 'elementClass',
  },
})
export class RequiresRolesDirective extends HasAccessDirective {
  private readonly destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  private previousRoles: Role[] | null = null;

  // eslint-disable-next-line @angular-eslint/prefer-signals
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
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((hasRole) => this.ixHasAccess = hasRole);
  }

  protected override cssClassList: string[] = [];

  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input('class')
  override get elementClass(): string {
    return this.cssClassList.join(' ');
  }

  override set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }
}
