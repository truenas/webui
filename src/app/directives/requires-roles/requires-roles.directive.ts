import {
  DestroyRef, Directive, effect, input, untracked, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isEqual } from 'lodash-es';
import { take } from 'rxjs';
import { AccessGateDirective } from 'app/directives/has-access/access-gate.directive';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

@Directive({
  selector: '[ixRequiresRoles]',
})
export class RequiresRolesDirective extends AccessGateDirective {
  private readonly destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  readonly ixRequiresRoles = input.required<Role[]>();

  private previousRoles: Role[] | null = null;

  constructor() {
    super();
    effect(() => {
      const roles = this.ixRequiresRoles();
      untracked(() => this.checkRoles(roles));
    });
  }

  private checkRoles(roles: Role[]): void {
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
      .subscribe((hasRole) => this.renderAccess(hasRole));
  }
}
