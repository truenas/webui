import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { AuthService } from 'app/services/auth/auth.service';

export function hasRoleGuard(roles: Role[]): CanActivateFn {
  return ((): Observable<boolean> => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.hasRole(roles).pipe(
      tap((canActivate) => {
        if (!canActivate) {
          router.navigate(['/', 'unauthorized']);
        }
      }),
    );
  }) as CanActivateFn;
}
