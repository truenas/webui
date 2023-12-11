import {
  AsyncValidatorFn, FormGroup, ValidationErrors,
} from '@angular/forms';
import {
  Observable, first, map, of,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

export function hasRoleAsyncFgValidator(
  authService: AuthService,
  roles: Role[],
  errMsg?: string,
): AsyncValidatorFn {
  return function matchOthersFgValidate(fg: FormGroup<unknown>): Observable<ValidationErrors | null> {
    if (!fg) {
      return of(null);
    }

    return authService.hasRole(roles).pipe(
      map((hasRole) => {
        if (hasRole) {
          return null;
        }

        return { hasRole: errMsg ? { message: errMsg } : true };
      }),
      first(),
    );
  };
}
