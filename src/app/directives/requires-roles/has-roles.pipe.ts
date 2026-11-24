import { Pipe, PipeTransform, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/modules/auth/auth.service';

/**
 * Whether the user holds any of `roles`, as `*ixRequiresRoles` decides it: no roles means anyone.
 *
 * For a `tn-menu-item`, which `*ixRequiresRoles` cannot lock: `tn-menu` draws its own button from
 * each item's inputs, so the missing-access wrapper never reaches it. Bind the lock to `disabled`:
 * `[disabled]="!(requiredRoles | hasRoles | async)"`.
 */
@Pipe({
  name: 'hasRoles',
})
export class HasRolesPipe implements PipeTransform {
  private authService = inject(AuthService);

  transform(roles: Role[] | null | undefined): Observable<boolean> {
    if (!roles?.length) {
      return of(true);
    }
    return this.authService.hasRole(roles);
  }
}
